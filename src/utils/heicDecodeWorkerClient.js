const SUPPORTS_WORKER = typeof Worker !== 'undefined';

let worker = null;
let readyPromise = null;
const pending = new Map();

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resetWorker(instance = worker) {
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
    readyPromise = null;
  }
}

function rejectAllPending(error) {
  for (const [id, { reject }] of pending.entries()) {
    pending.delete(id);
    reject(error);
  }
}

function cloneArrayBuffer(buffer) {
  try {
    return buffer.slice(0);
  } catch {
    const source = new Uint8Array(buffer);
    const copy = new Uint8Array(source.length);
    copy.set(source);
    return copy.buffer;
  }
}

async function ensureWorker() {
  if (!SUPPORTS_WORKER) return null;
  if (worker) return worker;
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    let instance;

    try {
      instance = new Worker(new URL('../workers/heicDecodeWorker.js', import.meta.url), {
        type: 'module',
      });
    } catch (error) {
      readyPromise = null;
      reject(error);
      return;
    }

    const timeoutId = setTimeout(() => {
      resetWorker(instance);
      reject(new Error('HEIC worker startup timed out'));
    }, 5000);

    instance.onmessage = (event) => {
      const message = event.data || {};
      const { id, type } = message;

      if (type === 'ready') {
        clearTimeout(timeoutId);
        worker = instance;
        resolve(instance);
        return;
      }

      if (type === 'decoded' && id && pending.has(id)) {
        const { resolve: resolvePending } = pending.get(id);
        pending.delete(id);
        resolvePending({
          width: message.width,
          height: message.height,
          data: new Uint8ClampedArray(message.data),
        });
        return;
      }

      if (type === 'error' && id && pending.has(id)) {
        const { reject: rejectPending } = pending.get(id);
        pending.delete(id);
        rejectPending(new Error(message.error || 'HEIC worker decode failed'));
      }
    };

    instance.onerror = () => {
      clearTimeout(timeoutId);
      rejectAllPending(new Error('HEIC worker error'));
      resetWorker(instance);
      reject(new Error('HEIC worker error'));
    };

    instance.onmessageerror = () => {
      clearTimeout(timeoutId);
      rejectAllPending(new Error('HEIC worker message error'));
      resetWorker(instance);
      reject(new Error('HEIC worker message error'));
    };
  }).finally(() => {
    if (!worker) {
      readyPromise = null;
    }
  });

  return readyPromise;
}

export function isSupported() {
  return SUPPORTS_WORKER;
}

export async function preload() {
  await ensureWorker();
  return true;
}

export async function decode(buffer) {
  const currentWorker = await ensureWorker();
  if (!currentWorker) {
    throw new Error('HEIC worker unavailable');
  }

  return new Promise((resolve, reject) => {
    const id = makeId();
    const workerBuffer = cloneArrayBuffer(buffer);
    pending.set(id, { resolve, reject });

    try {
      currentWorker.postMessage({ type: 'decodeHeic', id, buffer: workerBuffer }, [workerBuffer]);
    } catch {
      currentWorker.postMessage({ type: 'decodeHeic', id, buffer: workerBuffer });
    }
  });
}

export default {
  isSupported,
  preload,
  decode,
};
