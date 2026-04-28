let worker = null;
let seq = 0;
const pending = new Map();

const isSupported = () => typeof window !== 'undefined' && typeof Worker !== 'undefined';

const getWorker = () => {
  if (!isSupported()) return null;
  if (worker) return worker;

  worker = new Worker(new URL('../workers/heicWasmWorker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (event) => {
    const msg = event.data || {};
    const request = pending.get(msg.id);
    if (!request) return;

    if (msg.type === 'progress') {
      request.onProgress?.({ stage: msg.stage, percent: msg.percent });
      return;
    }

    pending.delete(msg.id);
    if (msg.type === 'done') {
      request.resolve({ result: msg.result, mimeType: msg.mimeType || 'image/png' });
      return;
    }

    request.reject(new Error(msg.error || 'Worker conversion failed'));
  };

  worker.onerror = (event) => {
    const message = event?.message || 'HEIC worker error';
    for (const [, request] of pending) {
      request.reject(new Error(message));
    }
    pending.clear();
    worker = null;
  };

  return worker;
};

const processHeic = (buffer, opts = {}) =>
  new Promise((resolve, reject) => {
    const activeWorker = getWorker();
    if (!activeWorker) {
      reject(new Error('HEIC worker is not supported in this environment'));
      return;
    }

    const id = `heic-${Date.now()}-${++seq}`;
    pending.set(id, { resolve, reject, onProgress: opts.onProgress });

    const payload = {
      buffer,
      maxBytes: opts.maxBytes,
    };

    activeWorker.postMessage({ id, type: 'convert', payload }, [buffer]);
  });

export default {
  isSupported,
  processHeic,
};
