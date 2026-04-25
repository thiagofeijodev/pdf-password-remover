// Worker module that loads the wasm-bindgen modules and runs heavy work off the main thread.
// This file is intended to be loaded as a module worker (new Worker(url, { type: 'module' })).

let heic = null;
let pdf = null;
const cancelled = new Set();

// Signal worker boot
try {
  console.log('[rustWasmWorker] worker started');
  self.postMessage({ type: 'worker-started' });
} catch {
  // Ignore if we can't post (e.g. if parent has gone away)
}

async function ensureHeic() {
  if (heic) return heic;
  try {
    const mod = await import('../wasm-heic/rust_heic_converter.js');
    // default export is the init function in wasm-bindgen generated glue
    await mod.default();
    if (mod.init_panic_hook) {
      try {
        mod.init_panic_hook();
      } catch {
        // Ignore if we can't post (e.g. if parent has gone away)
      }
    }
    heic = mod;
    return heic;
  } catch (err) {
    try {
      self.postMessage({ type: 'error', error: `HEIC import failed: ${String(err)}` });
    } catch {
      // Ignore if we can't post (e.g. if parent has gone away)
    }
    throw err;
  }
}

async function ensurePdf() {
  if (pdf) return pdf;
  try {
    const mod = await import('../wasm/rust_pdf_remover.js');
    await mod.default();
    if (mod.init_panic_hook) {
      try {
        mod.init_panic_hook();
      } catch {
        // Ignore if we can't post (e.g. if parent has gone away)
      }
    }
    pdf = mod;
    return pdf;
  } catch (err) {
    try {
      self.postMessage({ type: 'error', error: `PDF import failed: ${String(err)}` });
    } catch {
      // Ignore if we can't post (e.g. if parent has gone away)
    }
    throw err;
  }
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  const { type, id } = msg;

  if (type === 'cancel' && id) {
    cancelled.add(id);
    // We cannot reliably interrupt a synchronous wasm call; mark as cancelled and ignore outcome.
    self.postMessage({ type: 'cancelled', id });
    return;
  }

  try {
    if (type === 'processHeic') {
      const { buffer, maxBytes } = msg;
      await ensureHeic();
      if (cancelled.has(id)) return self.postMessage({ type: 'cancelled', id });
      self.postMessage({ type: 'progress', id, stage: 'processing' });

      const input = new Uint8Array(buffer);
      let outBytes;
      if (maxBytes) {
        outBytes = heic.convert_heic_to_png_under_size(input, maxBytes);
      } else {
        outBytes = heic.convert_heic_to_png(input);
      }

      if (cancelled.has(id)) {
        cancelled.delete(id);
        return self.postMessage({ type: 'cancelled', id });
      }
      cancelled.delete(id);

      // Copy result into transferable ArrayBuffer
      const resultUint8 = new Uint8Array(outBytes);
      self.postMessage({ type: 'done', id, result: resultUint8.buffer, mimeType: 'image/png' }, [
        resultUint8.buffer,
      ]);
      return;
    }

    if (type === 'processPdf') {
      const { buffer, password } = msg;
      await ensurePdf();
      if (cancelled.has(id)) return self.postMessage({ type: 'cancelled', id });
      self.postMessage({ type: 'progress', id, stage: 'processing' });

      const input = new Uint8Array(buffer);
      const outBytes = pdf.remove_password(input, password || '');

      if (cancelled.has(id)) {
        cancelled.delete(id);
        return self.postMessage({ type: 'cancelled', id });
      }
      cancelled.delete(id);

      const resultUint8 = new Uint8Array(outBytes);
      self.postMessage(
        { type: 'done', id, result: resultUint8.buffer, mimeType: 'application/pdf' },
        [resultUint8.buffer],
      );
      return;
    }

    if (type === 'init') {
      // Optional: pre-load requested module(s)
      if (msg.module === 'heic') await ensureHeic();
      if (msg.module === 'pdf') await ensurePdf();
      return self.postMessage({ type: 'ready' });
    }
  } catch (err) {
    try {
      self.postMessage({ type: 'error', id, error: String(err) });
    } catch {
      // Ignore if we can't post (e.g. if parent has gone away)
    }
  }
};
