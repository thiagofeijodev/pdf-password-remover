import init, {
  convert_heic_to_png,
  init_panic_hook,
  convert_heic_to_png_under_size,
} from '../wasm-heic/rust_heic_converter.js';

let wasmInit = null;

/**
 * Initialize the HEIC converter WASM module
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
 * Convert HEIC image to PNG using Rust WASM
 * @param {ArrayBuffer} heicData - Raw HEIC image bytes
 * @returns {Promise<Blob>} PNG image as Blob
 */
export const heicToPng = async (heicData, opts = {}) => {
  opts.onProgress?.({ stage: 'loading', percent: 15 });
  await initWasm();
  opts.onProgress?.({ stage: 'decoding', percent: 45 });

  try {
    const uint8Array = new Uint8Array(heicData);
    const pngBytes = convert_heic_to_png(uint8Array);
    opts.onProgress?.({ stage: 'encoding', percent: 90 });
    return new Blob([pngBytes], { type: 'image/png' });
  } catch (err) {
    console.error('[RustWasm] Error converting HEIC to PNG:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to convert HEIC to PNG');
  }
};

/**
 * Convert HEIC to PNG and ensure result is under maxBytes by performing resizing in Rust.
 */
export const heicToPngUnderSize = async (heicData, maxBytes = 2 * 1024 * 1024, opts = {}) => {
  opts.onProgress?.({ stage: 'loading', percent: 15 });
  await initWasm();
  opts.onProgress?.({ stage: 'resizing', percent: 50 });

  try {
    const uint8Array = new Uint8Array(heicData);
    const pngBytes = convert_heic_to_png_under_size(uint8Array, maxBytes);
    opts.onProgress?.({ stage: 'encoding', percent: 90 });
    return new Blob([pngBytes], { type: 'image/png' });
  } catch (err) {
    console.error('[RustWasm] Error converting HEIC to PNG under size:', err);
    throw new Error(typeof err === 'string' ? err : 'Failed to convert HEIC to PNG under size');
  }
};
