import init, {
  convert_heic_to_png,
  convert_heic_to_png_under_size,
  init_panic_hook,
} from '../wasm-heic/rust_heic_converter.js';

let wasmReady = null;

const ensureReady = async () => {
  if (wasmReady) return wasmReady;
  wasmReady = init().then(() => {
    init_panic_hook();
  });
  return wasmReady;
};

self.onmessage = async (event) => {
  const { id, type, payload } = event.data || {};
  if (type !== 'convert' || !id) return;

  try {
    self.postMessage({ id, type: 'progress', stage: 'loading', percent: 15 });
    await ensureReady();

    const { buffer, maxBytes } = payload || {};
    const input = new Uint8Array(buffer);

    self.postMessage({
      id,
      type: 'progress',
      stage: maxBytes ? 'resizing' : 'decoding',
      percent: maxBytes ? 50 : 45,
    });

    const outputBytes = maxBytes
      ? convert_heic_to_png_under_size(input, maxBytes)
      : convert_heic_to_png(input);

    self.postMessage({ id, type: 'progress', stage: 'encoding', percent: 90 });

    const outputBuffer = outputBytes.buffer.slice(
      outputBytes.byteOffset,
      outputBytes.byteOffset + outputBytes.byteLength,
    );

    self.postMessage(
      {
        id,
        type: 'done',
        result: outputBuffer,
        mimeType: 'image/png',
      },
      [outputBuffer],
    );
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error?.message || String(error) || 'HEIC worker conversion failed',
    });
  }
};
