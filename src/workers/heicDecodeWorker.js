import { decodeHeicBuffer } from '../utils/libheifDecode';

try {
  self.postMessage({ type: 'ready' });
} catch {
  // ignore startup postMessage failures
}

self.onmessage = async (event) => {
  const message = event.data || {};
  const { id, type } = message;

  if (type !== 'decodeHeic') return;

  try {
    const decoded = await decodeHeicBuffer(message.buffer);
    self.postMessage(
      {
        type: 'decoded',
        id,
        width: decoded.width,
        height: decoded.height,
        data: decoded.data.buffer,
      },
      [decoded.data.buffer],
    );
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
