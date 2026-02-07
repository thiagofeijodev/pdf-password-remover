import init, { remove_password, init_panic_hook } from '../wasm/rust_pdf_remover.js';
import workerClient from './workerWasmClient';

let wasmInit = null;

/**
 * Initialize the Rust WebAssembly module (fallback when worker unsupported)
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
 * Remove password from encrypted PDF using Rust WASM or worker when available
 */
export const rustPdfRemover = async (pdfData, password) => {
  if (workerClient && workerClient.isSupported()) {
    const { result, mimeType } = await workerClient.processPdf(pdfData, password);
    return new Blob([result], { type: mimeType || 'application/pdf' });
  }

  await initWasm();

  try {
    const uint8Array = new Uint8Array(pdfData);
    const decryptedPdf = remove_password(uint8Array, password);
    return new Blob([decryptedPdf], { type: 'application/pdf' });
  } catch (err) {
    console.error('[RustWasm] Error removing password:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to remove password');
  }
};
