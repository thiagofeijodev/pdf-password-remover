// Worker client that communicates with src/workers/rustWasmWorker.js
const SUPPORTS_WORKER = typeof Worker !== 'undefined';
const USE_WORKER_STORAGE_KEY = 'pdfPasswordRemover_useWorker';

const pending = new Map();
const progressListeners = new Set();

let worker = null;
let useWorkerPreference = null;

function getUseWorkerFromStorage() {
  try {
    const stored = localStorage.getItem(USE_WORKER_STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

export function getUseWorker() {
  if (useWorkerPreference === null) {
    useWorkerPreference = getUseWorkerFromStorage();
  }
  return useWorkerPreference;
}

export function setUseWorker(value) {
  const next = !!value;
  useWorkerPreference = next;
  try {
    localStorage.setItem(USE_WORKER_STORAGE_KEY, String(next));
  } catch {
    // ignore storage errors
  }
  if (!next && worker) {
    worker.terminate();
    worker = null;
    rejectAllPending(new Error('Worker disabled by user'));
  }
}

function rejectAllPending(err) {
  for (const [id, { reject }] of pending.entries()) {
    try {
      reject(err);
    } catch {
      // ignore rejection errors
    }
    pending.delete(id);
  }
}

function ensureWorker() {
  if (!SUPPORTS_WORKER || !getUseWorker()) return null;
  if (worker) return worker;
  // Use bundler-friendly worker creation
  try {
    worker = new Worker(new URL('../workers/rustWasmWorker.js', import.meta.url), {
      type: 'module',
    });
  } catch (err) {
    console.warn(
      '[workerWasmClient] Failed to create Worker via file URL, attempting blob fallback:',
      err,
    );
    // Attempt a blob-based module worker that imports the wasm glue via absolute URLs.
    try {
      const heicUrl = new URL('../wasm-heic/rust_heic_converter.js', import.meta.url).toString();
      const pdfUrl = new URL('../wasm/rust_pdf_remover.js', import.meta.url).toString();
      const fallbackSrc = `
        let heic=null; let pdf=null; const cancelled=new Set();
        async function ensureHeic(){ if(heic) return heic; try{ const mod=await import('${heicUrl}'); await mod.default(); if(mod.init_panic_hook){try{mod.init_panic_hook()}catch(e){}} heic=mod; return heic;}catch(e){self.postMessage({type:'error', error:'HEIC import failed:'+String(e)}); throw e}}
        async function ensurePdf(){ if(pdf) return pdf; try{ const mod=await import('${pdfUrl}'); await mod.default(); if(mod.init_panic_hook){try{mod.init_panic_hook()}catch(e){}} pdf=mod; return pdf;}catch(e){self.postMessage({type:'error', error:'PDF import failed:'+String(e)}); throw e}}
        self.onmessage=async(ev)=>{ const msg=ev.data||{}; const {type,id}=msg; if(type==='cancel'&&id){cancelled.add(id); self.postMessage({type:'cancelled',id}); return;} try{ if(type==='processHeic'){ const {buffer,maxBytes}=msg; await ensureHeic(); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); self.postMessage({type:'progress',id,stage:'processing'}); const input=new Uint8Array(buffer); let outBytes; if(maxBytes){ outBytes=heic.convert_heic_to_png_under_size(input,maxBytes);}else{ outBytes=heic.convert_heic_to_png(input);} if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); const resultUint8=new Uint8Array(outBytes); self.postMessage({type:'done',id,result:resultUint8.buffer,mimeType:'image/png'},[resultUint8.buffer]); return;} if(type==='processPdf'){ const {buffer,password}=msg; await ensurePdf(); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); self.postMessage({type:'progress',id,stage:'processing'}); const input=new Uint8Array(buffer); const outBytes=pdf.remove_password(input,password||''); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); const resultUint8=new Uint8Array(outBytes); self.postMessage({type:'done',id,result:resultUint8.buffer,mimeType:'application/pdf'},[resultUint8.buffer]); return;} if(type==='init'){ if(msg.module==='heic') await ensureHeic(); if(msg.module==='pdf') await ensurePdf(); return self.postMessage({type:'ready'});} }catch(err){ try{ self.postMessage({type:'error',id,error:String(err)}); }catch(e){} }}
      `;
      const blob = new Blob([fallbackSrc], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl, { type: 'module' });
      // release blob url after worker created
      URL.revokeObjectURL(blobUrl);
    } catch (err2) {
      console.error('[workerWasmClient] Blob fallback failed:', err2);
      rejectAllPending(err2);
      worker = null;
      return null;
    }
  }

  worker.onmessage = (ev) => {
    const msg = ev.data || {};

    console.log('[workerWasmClient] message from worker:', msg && msg.type);
    const { type, id } = msg;
    if (type === 'worker-started' || type === 'ready') {
      // optional bootstrap notification

      console.log('[workerWasmClient] worker ready:', type);
      return;
    }
    if (type === 'progress') {
      for (const cb of progressListeners) cb(id, msg);
      return;
    }

    if (type === 'done' && id && pending.has(id)) {
      const { resolve } = pending.get(id);
      pending.delete(id);
      resolve({ result: msg.result, mimeType: msg.mimeType });
      return;
    }

    if (type === 'error' && id && pending.has(id)) {
      const { reject } = pending.get(id);
      pending.delete(id);
      reject(new Error(msg.error || 'Worker error'));
      return;
    }

    if (type === 'cancelled' && id && pending.has(id)) {
      const { reject } = pending.get(id);
      pending.delete(id);
      reject(new Error('Cancelled'));
      return;
    }
  };

  worker.onerror = (err) => {
    console.error('[workerWasmClient] Worker error', err);
    rejectAllPending(new Error('Worker error'));
  };

  worker.onmessageerror = (err) => {
    console.error('[workerWasmClient] Worker message error', err);
    rejectAllPending(new Error('Worker message error'));
  };

  return worker;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isSupported() {
  return SUPPORTS_WORKER && getUseWorker();
}

export function onProgress(cb) {
  progressListeners.add(cb);
  return () => progressListeners.delete(cb);
}

export function processHeic(buffer, opts = {}) {
  if (!isSupported()) return Promise.reject(new Error('Workers not supported'));
  const id = makeId();
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const { maxBytes } = opts;
    try {
      w.postMessage({ type: 'processHeic', id, buffer, maxBytes }, [buffer]);
    } catch {
      // If transferring failed, send without transfer
      w.postMessage({ type: 'processHeic', id, buffer, maxBytes });
    }
  });
}

export function processPdf(buffer, password = '') {
  if (!isSupported()) return Promise.reject(new Error('Workers not supported'));
  const id = makeId();
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    try {
      w.postMessage({ type: 'processPdf', id, buffer, password }, [buffer]);
    } catch {
      w.postMessage({ type: 'processPdf', id, buffer, password });
    }
  });
}

export function cancel(id) {
  if (!worker) return;
  worker.postMessage({ type: 'cancel', id });
}

export default {
  isSupported,
  getUseWorker,
  setUseWorker,
  onProgress,
  processHeic,
  processPdf,
  cancel,
};
