import init, { remove_password, init_panic_hook } from '../wasm/rust_pdf_remover.js';

let wasmInit = null;

/**
 * Initialize the Rust WebAssembly module
 */
export const initWasm = async () => {
  if (wasmInit) return wasmInit;

  try {
    wasmInit = await init();
    init_panic_hook();
    return wasmInit;
  } catch (err) {
    console.error('[RustWasm] Failed to initialize:', err);
    throw err;
  }
};

/**
 * Remove password from encrypted PDF using Rust WASM
 */
export const rustPdfRemover = async (pdfData, password, opts = {}) => {
  opts.onProgress?.({ stage: 'loading', percent: 15 });
  await initWasm();
  opts.onProgress?.({ stage: 'processing', percent: 60 });

  try {
    const uint8Array = new Uint8Array(pdfData);
    const decryptedPdf = remove_password(uint8Array, password);
    opts.onProgress?.({ stage: 'writing', percent: 95 });
    return new Blob([decryptedPdf], { type: 'application/pdf' });
  } catch (err) {
    console.error('[RustWasm] Error removing password:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to remove password');
  }
};
