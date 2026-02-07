import init, { convert_heic_to_png, init_panic_hook } from '../wasm-heic/rust_heic_converter.js';

let wasmInit = null;

/**
 * Initialize the HEIC converter WASM module
 */
export const initWasm = async () => {
  if (wasmInit) return wasmInit;

  try {
    // init() fetches the wasm file automatically if using --target web
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
export const heicToPng = async (heicData) => {
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
