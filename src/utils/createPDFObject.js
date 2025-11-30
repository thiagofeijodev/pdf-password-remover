import * as pdfjsLib from 'pdfjs-dist';

export const createPDFObject = async (file, password) => {
  // Create a safe copy of an ArrayBuffer to avoid detached buffer issues
  function copyArrayBuffer(arrayBuffer) {
    try {
      // Most browsers support slice on ArrayBuffer
      return arrayBuffer.slice(0);
    } catch (e) {
      // Fallback: create a new ArrayBuffer and copy the bytes
      // Log the error briefly so the catch variable is used and visible in logs
      console.warn('copyArrayBuffer slice failed, using fallback copy', e);
      const src = new Uint8Array(arrayBuffer);
      const dest = new Uint8Array(src.length);
      dest.set(src);
      return dest.buffer;
    }
  }

  const arrayBuffer = await file.arrayBuffer();

  // Create copies of the ArrayBuffer immediately to avoid detached buffer issues
  // Use helper to ensure a safe copy even if slice is not available
  const bufferForPdfJs = copyArrayBuffer(arrayBuffer);

  // Load PDF with password using PDF.js
  const loadingTask = pdfjsLib.getDocument({
    password: password,
    data: bufferForPdfJs,
  });

  const pdfDocument = await loadingTask.promise;

  return pdfDocument;
};
