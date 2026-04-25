import init, {
  convert_heic_to_png,
  init_panic_hook,
  convert_heic_to_png_under_size,
} from '../wasm-heic/rust_heic_converter.js';

import workerClient from './workerWasmClient';

let wasmInit = null;

/**
 * Initialize the HEIC converter WASM module (fallback path when worker unsupported)
 */
export const initWasm = async () => {
  if (wasmInit) return wasmInit;

  try {
    wasmInit = await init();
    init_panic_hook();
    return wasmInit;
  } catch (err) {
    console.error('[RustWasm] Failed to initialize HEIC converter:', err);
    throw err;
  }
};

/**
 * Convert HEIC image to PNG using Rust WASM or worker when available
 * @param {ArrayBuffer} heicData - Raw HEIC image bytes
 * @returns {Promise<Blob>} PNG image as Blob
 */
export const heicToPng = async (heicData, opts = {}) => {
  if (workerClient && workerClient.isSupported()) {
    try {
      const { result, mimeType } = await workerClient.processHeic(heicData, opts);
      return new Blob([result], { type: mimeType || 'image/png' });
    } catch (err) {
      console.warn('[RustWasm] HEIC worker processing failed, falling back to main thread:', err);
    }
  }

  await initWasm();

  try {
    const uint8Array = new Uint8Array(heicData);
    const pngBytes = convert_heic_to_png(uint8Array);
    return new Blob([pngBytes], { type: 'image/png' });
  } catch (err) {
    console.error('[RustWasm] Error converting HEIC to PNG:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to convert HEIC to PNG');
  }
};

/**
 * Convert HEIC to PNG and ensure result is under maxBytes by performing resizing in Rust.
 * Uses worker when available.
 */
export const heicToPngUnderSize = async (heicData, maxBytes = 2 * 1024 * 1024, opts = {}) => {
  if (workerClient && workerClient.isSupported()) {
    try {
      const { result, mimeType } = await workerClient.processHeic(heicData, { maxBytes, ...opts });
      return new Blob([result], { type: mimeType || 'image/png' });
    } catch (err) {
      console.warn('[RustWasm] HEIC worker compression failed, falling back to main thread:', err);
    }
  }

  await initWasm();

  try {
    const uint8Array = new Uint8Array(heicData);
    const pngBytes = convert_heic_to_png_under_size(uint8Array, maxBytes);
    return new Blob([pngBytes], { type: 'image/png' });
  } catch (err) {
    console.error('[RustWasm] Error converting HEIC to PNG under size:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to convert HEIC to PNG under size');
  }
};
