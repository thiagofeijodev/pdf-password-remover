import { decodeHeicBuffer } from './libheifDecode';
import heicDecodeWorkerClient from './heicDecodeWorkerClient';

function createCanvas(width, height) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas conversion requires a browser environment');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function putDecodedImageOnCanvas(decoded) {
  const canvas = createCanvas(decoded.width, decoded.height);
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create a 2D canvas context');
  }

  const imageData =
    typeof ImageData === 'function'
      ? new ImageData(decoded.data, decoded.width, decoded.height)
      : context.createImageData(decoded.width, decoded.height);

  if (typeof ImageData !== 'function') {
    imageData.data.set(decoded.data);
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function scaleCanvas(sourceCanvas, width, height) {
  const targetCanvas = createCanvas(width, height);
  const context = targetCanvas.getContext('2d');

  if (!context) {
    throw new Error('Could not create a 2D canvas context');
  }

  context.drawImage(sourceCanvas, 0, 0, width, height);
  return targetCanvas;
}

async function exportCompressedBlob(sourceCanvas, maxBytes) {
  let quality = 0.92;
  let scale = 1;
  let bestBlob = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const width = Math.max(1, Math.round(sourceCanvas.width * scale));
    const height = Math.max(1, Math.round(sourceCanvas.height * scale));
    const workingCanvas =
      width === sourceCanvas.width && height === sourceCanvas.height
        ? sourceCanvas
        : scaleCanvas(sourceCanvas, width, height);

    const blob = await canvasToBlob(workingCanvas, 'image/jpeg', quality);
    bestBlob = blob;

    if (blob.size <= maxBytes) {
      return blob;
    }

    if (quality > 0.55) {
      quality -= 0.1;
    } else {
      quality = 0.92;
      scale *= 0.8;
    }
  }

  return bestBlob;
}

async function decodeWithBestAvailablePath(buffer) {
  if (heicDecodeWorkerClient.isSupported()) {
    try {
      return await heicDecodeWorkerClient.decode(buffer);
    } catch (error) {
      console.warn('[libheifConverter] Worker decode failed, falling back to main thread:', error);
    }
  }

  return decodeHeicBuffer(buffer);
}

export async function preloadHeicDecoder() {
  if (!heicDecodeWorkerClient.isSupported()) {
    return false;
  }

  await heicDecodeWorkerClient.preload();
  return true;
}

export async function convertHeicToBrowserBlob(buffer, options = {}) {
  const decoded = await decodeWithBestAvailablePath(buffer);
  const canvas = putDecodedImageOnCanvas(decoded);

  if (options.maxBytes) {
    return exportCompressedBlob(canvas, options.maxBytes);
  }

  return canvasToBlob(canvas, 'image/png');
}
