// Worker client that communicates with src/workers/rustWasmWorker.js
const SUPPORTS_WORKER = typeof Worker !== 'undefined';
const WORKER_READY_TIMEOUT_MS = 5000;

const pending = new Map();

let worker = null;
let workerReadyPromise = null;
let workerStrategy = null;
let disableModuleWorker = false;

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

function resetWorkerState(instance = worker) {
  if (instance) {
    instance.onmessage = null;
    instance.onerror = null;
    instance.onmessageerror = null;
    try {
      instance.terminate();
    } catch {
      // ignore terminate failures
    }
  }
  if (!instance || instance === worker) {
    worker = null;
    workerReadyPromise = null;
    workerStrategy = null;
  }
}

function createBlobWorker() {
  const heicUrl = new URL('../wasm-heic/rust_heic_converter.js', import.meta.url).toString();
  const pdfUrl = new URL('../wasm/rust_pdf_remover.js', import.meta.url).toString();
  const fallbackSrc = `
    let heic=null; let pdf=null; const cancelled=new Set();
    async function ensureHeic(){ if(heic) return heic; try{ const mod=await import('${heicUrl}'); await mod.default(); if(mod.init_panic_hook){try{mod.init_panic_hook()}catch(e){}} heic=mod; return heic;}catch(e){self.postMessage({type:'error', error:'HEIC import failed:'+String(e)}); throw e}}
    async function ensurePdf(){ if(pdf) return pdf; try{ const mod=await import('${pdfUrl}'); await mod.default(); if(mod.init_panic_hook){try{mod.init_panic_hook()}catch(e){}} pdf=mod; return pdf;}catch(e){self.postMessage({type:'error', error:'PDF import failed:'+String(e)}); throw e}}
    self.onmessage=async(ev)=>{ const msg=ev.data||{}; const {type,id}=msg; if(type==='cancel'&&id){cancelled.add(id); self.postMessage({type:'cancelled',id}); return;} try{ if(type==='processHeic'){ const {buffer,maxBytes}=msg; await ensureHeic(); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); self.postMessage({type:'progress',id,stage:'processing'}); const input=new Uint8Array(buffer); let outBytes; if(maxBytes){ outBytes=heic.convert_heic_to_png_under_size(input,maxBytes);}else{ outBytes=heic.convert_heic_to_png(input);} if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); const resultUint8=new Uint8Array(outBytes); self.postMessage({type:'done',id,result:resultUint8.buffer,mimeType:'image/png'},[resultUint8.buffer]); return;} if(type==='processPdf'){ const {buffer,password}=msg; await ensurePdf(); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); self.postMessage({type:'progress',id,stage:'processing'}); const input=new Uint8Array(buffer); const outBytes=pdf.remove_password(input,password||''); if(cancelled.has(id)) return self.postMessage({type:'cancelled',id}); const resultUint8=new Uint8Array(outBytes); self.postMessage({type:'done',id,result:resultUint8.buffer,mimeType:'application/pdf'},[resultUint8.buffer]); return;} if(type==='init'){ if(msg.module==='heic') await ensureHeic(); if(msg.module==='pdf') await ensurePdf(); return self.postMessage({type:'ready',id});} }catch(err){ try{ self.postMessage({type:'error',id,error:String(err)}); }catch(e){} }}
  `;
  const blob = new Blob([fallbackSrc], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return new Worker(blobUrl, { type: 'module' });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function attachWorkerListeners(instance, markReady, markFailed) {
  instance.onmessage = (ev) => {
    const msg = ev.data || {};

    console.log('[workerWasmClient] message from worker:', msg && msg.type);
    const { type, id } = msg;
    if (type === 'worker-started' || type === 'ready') {
      if (id && pending.has(id)) {
        const { resolve } = pending.get(id);
        pending.delete(id);
        resolve(msg);
        return;
      }
      console.log('[workerWasmClient] worker ready:', type);
      markReady();
      return;
    }
    if (type === 'progress') {
      if (id && pending.has(id)) {
        const { onProgress } = pending.get(id);
        if (onProgress) onProgress(msg);
      }
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

  instance.onerror = (err) => {
    console.error('[workerWasmClient] Worker error', err);
    markFailed(new Error('Worker error'));
    rejectAllPending(new Error('Worker error'));
    resetWorkerState(instance);
  };

  instance.onmessageerror = (err) => {
    console.error('[workerWasmClient] Worker message error', err);
    markFailed(new Error('Worker message error'));
    rejectAllPending(new Error('Worker message error'));
    resetWorkerState(instance);
  };
}

function waitForWorkerReady(instance) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Worker startup timed out'));
    }, WORKER_READY_TIMEOUT_MS);

    const markReady = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(instance);
    };

    const markFailed = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(err);
    };

    attachWorkerListeners(instance, markReady, markFailed);
  });
}

async function tryCreateWorker(label) {
  let instance;
  try {
    instance =
      label === 'module'
        ? new Worker(new URL('../workers/rustWasmWorker.js', import.meta.url), {
            type: 'module',
          })
        : createBlobWorker();
  } catch (err) {
    throw new Error(`${label} worker creation failed: ${err.message}`);
  }

  try {
    await waitForWorkerReady(instance);
    worker = instance;
    workerStrategy = label;
    return worker;
  } catch (err) {
    resetWorkerState(instance);
    throw err;
  }
}

async function ensureWorker() {
  if (!SUPPORTS_WORKER) return null;
  if (worker) return worker;
  if (workerReadyPromise) return workerReadyPromise;

  workerReadyPromise = (async () => {
    try {
      if (!disableModuleWorker) {
        return await tryCreateWorker('module');
      }
      return await tryCreateWorker('blob');
    } catch (moduleErr) {
      disableModuleWorker = true;
      console.warn(
        '[workerWasmClient] Module worker startup failed, attempting blob fallback:',
        moduleErr,
      );
      try {
        return await tryCreateWorker('blob');
      } catch (blobErr) {
        console.error('[workerWasmClient] Blob fallback failed:', blobErr);
        throw blobErr;
      }
    } finally {
      if (!worker) {
        workerReadyPromise = null;
      }
    }
  })();

  return workerReadyPromise;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneArrayBuffer(buffer) {
  try {
    return buffer.slice(0);
  } catch (err) {
    console.warn('[workerWasmClient] ArrayBuffer slice failed, copying manually:', err);
    const source = new Uint8Array(buffer);
    const copy = new Uint8Array(source.length);
    copy.set(source);
    return copy.buffer;
  }
}

export function isSupported() {
  return SUPPORTS_WORKER;
}

export async function processHeic(buffer, opts = {}) {
  if (!isSupported()) return Promise.reject(new Error('Workers not supported'));
  const id = makeId();
  const w = await ensureWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress: opts.onProgress });
    const { maxBytes } = opts;
    const workerBuffer = cloneArrayBuffer(buffer);
    try {
      w.postMessage({ type: 'processHeic', id, buffer: workerBuffer, maxBytes }, [workerBuffer]);
    } catch {
      // If transferring failed, send without transfer
      w.postMessage({ type: 'processHeic', id, buffer: workerBuffer, maxBytes });
    }
  });
}

export async function processPdf(buffer, password = '', opts = {}) {
  if (!isSupported()) return Promise.reject(new Error('Workers not supported'));
  const id = makeId();
  const w = await ensureWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress: opts.onProgress });
    const workerBuffer = cloneArrayBuffer(buffer);
    try {
      w.postMessage({ type: 'processPdf', id, buffer: workerBuffer, password }, [workerBuffer]);
    } catch {
      w.postMessage({ type: 'processPdf', id, buffer: workerBuffer, password });
    }
  });
}

export function cancel(id) {
  if (!worker) return;
  worker.postMessage({ type: 'cancel', id });
}

async function sendInit(moduleName) {
  const w = await ensureWorker();
  if (!w) throw new Error('Worker unavailable');

  return new Promise((resolve, reject) => {
    const id = makeId();
    pending.set(id, { resolve, reject });
    w.postMessage({ type: 'init', id, module: moduleName });
  });
}

export async function preload(moduleName) {
  try {
    await sendInit(moduleName);
    return true;
  } catch (err) {
    if (workerStrategy === 'module') {
      console.warn(
        `[workerWasmClient] ${moduleName} preload failed in module worker, retrying blob worker:`,
        err,
      );
      disableModuleWorker = true;
      resetWorkerState();
      await sendInit(moduleName);
      return true;
    }
    throw err;
  }
}

export default {
  isSupported,
  processHeic,
  processPdf,
  cancel,
  preload,
};
