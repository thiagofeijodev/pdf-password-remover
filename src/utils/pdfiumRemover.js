/**
 * PDF Password Remover using @embedpdf/pdfium
 *
 * Uses PDFium WebAssembly library with full PDF support including password decryption.
 *
 * Features:
 * - Full PDF support (handles complex PDFs)
 * - Native password decryption
 * - Maintains PDF integrity
 * - Pre-compiled, no recompilation needed
 */

import { init } from '@embedpdf/pdfium';

let pdfiumInstance = null;

/**
 * Initialize pdfium WebAssembly module
 */
const initPdfium = async () => {
  if (pdfiumInstance) return pdfiumInstance;

  try {
    console.log('[PDFium] Initializing pdfium.wasm...');

    // Load WASM binary from CDN
    const pdfiumWasm = 'https://feijo.dev/pdf-password-remover/pdfium.wasm';
    const response = await fetch(pdfiumWasm);
    const wasmBinary = await response.arrayBuffer();

    pdfiumInstance = await init({ wasmBinary });

    // Initialize the PDFium extension library (REQUIRED)
    pdfiumInstance.PDFiumExt_Init();

    console.log('[PDFium] ✓ pdfium.wasm initialized');
    return pdfiumInstance;
  } catch (err) {
    console.error('[PDFium] ✗ Failed to initialize pdfium:', err);
    throw err;
  }
};

/**
 * Helper to encode password string to UTF-8 in WASM memory
 */
const encodePasswordToWasm = (pdfium, password) => {
  // The wrapper handles string-to-pointer conversion automatically
  // Just return the password string or 0 for no password
  return password || 0;
};

/**
 * Remove password from encrypted PDF using FPDF_SaveAsCopy
 * @param {ArrayBuffer} pdfData - PDF file as ArrayBuffer
 * @param {string} password - PDF password
 * @returns {Promise<Blob>} - Decrypted PDF as Blob
 */
export const pdfiumRemover = async (pdfData, password) => {
  const pdfium = await initPdfium();

  try {
    console.log('[PDFium] Attempting direct PDF decryption...');
    console.log(`[PDFium] PDF size: ${pdfData.byteLength} bytes`);

    // Allocate memory for PDF data
    const pdfSize = pdfData.byteLength;
    const filePtr = pdfium.pdfium.wasmExports.malloc(pdfSize);
    const heapBytes = new Uint8Array(pdfium.pdfium.wasmExports.memory.buffer, filePtr, pdfSize);
    heapBytes.set(new Uint8Array(pdfData));

    // Encode password if provided
    const passwordPtr = encodePasswordToWasm(pdfium, password);

    try {
      // Load PDF document with password
      const docPtr = pdfium.FPDF_LoadMemDocument(filePtr, pdfSize, passwordPtr);

      if (!docPtr) {
        const errorCode = pdfium.FPDF_GetLastError();
        console.log(`[PDFium] Error code: ${errorCode}`);

        if (errorCode === 4) {
          throw new Error('Password required or incorrect password');
        } else if (errorCode === 0 || errorCode === 1) {
          // No password needed or error, try with password 0
          pdfium.pdfium.wasmExports.free(filePtr);
          if (passwordPtr) pdfium.pdfium.wasmExports.free(passwordPtr);
          return new Blob([pdfData], { type: 'application/pdf' });
        } else {
          throw new Error(`Failed to load PDF: error code ${errorCode}`);
        }
      }

      console.log('[PDFium] ✓ PDF loaded');

      // Get page count to verify it's accessible
      const pageCount = pdfium.FPDF_GetPageCount(docPtr);
      console.log(`[PDFium] ✓ PDF has ${pageCount} pages`);

      if (pageCount <= 0) {
        throw new Error('Invalid PDF or unable to access pages');
      }

      // Array to collect the saved PDF bytes
      const savedPdfChunks = [];

      // Create the FPDF_FILEWRITE structure
      // The structure needs: version (int) and WriteBlock (function pointer)
      const fileWriteStructSize = 8; // 4 bytes for version + 4 bytes for function pointer
      const fileWritePtr = pdfium.pdfium.wasmExports.malloc(fileWriteStructSize);

      // Set version to 1
      const view = new DataView(pdfium.pdfium.wasmExports.memory.buffer);
      view.setInt32(fileWritePtr, 1, true); // version = 1, little-endian

      // Create a callback function for writing blocks
      // The callback signature is: int (*WriteBlock)(FPDF_FILEWRITE* pThis, const void* data, unsigned long size)
      const writeBlockCallback = pdfium.pdfium.addFunction((pThis, dataPtr, size) => {
        try {
          // Read the data from WASM memory
          const data = new Uint8Array(pdfium.pdfium.wasmExports.memory.buffer, dataPtr, size);
          // Copy the data to our chunks array
          savedPdfChunks.push(new Uint8Array(data));
          return 1; // Return 1 for success
        } catch (err) {
          console.error('[PDFium] Error in WriteBlock callback:', err);
          return 0; // Return 0 for failure
        }
      }, 'iiii'); // signature: int function(int, int, int)

      // Set the function pointer in the structure
      view.setInt32(fileWritePtr + 4, writeBlockCallback, true); // little-endian

      // FPDF_REMOVE_SECURITY flag = 3
      const FPDF_REMOVE_SECURITY = 3;

      // Save the PDF without password
      console.log('[PDFium] Calling FPDF_SaveAsCopy...');
      const saveResult = pdfium.FPDF_SaveAsCopy(docPtr, fileWritePtr, FPDF_REMOVE_SECURITY);

      if (!saveResult) {
        console.error('[PDFium] ✗ Failed to save PDF');
        pdfium.pdfium.removeFunction(writeBlockCallback);
        pdfium.pdfium.wasmExports.free(fileWritePtr);
        pdfium.FPDF_CloseDocument(docPtr);
        throw new Error('Failed to save PDF copy');
      }

      console.log(`[PDFium] ✓ PDF saved successfully (${savedPdfChunks.length} chunks)`);

      // Combine all chunks into a single buffer
      const totalSize = savedPdfChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const savedPdfData = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of savedPdfChunks) {
        savedPdfData.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[PDFium] ✓ Combined PDF data: ${savedPdfData.length} bytes`);

      // Clean up
      pdfium.pdfium.removeFunction(writeBlockCallback);
      pdfium.pdfium.wasmExports.free(fileWritePtr);
      pdfium.FPDF_CloseDocument(docPtr);

      console.log('[PDFium] ✓ PDF decrypted successfully');
      console.log('[PDFium] savedPdfData type:', savedPdfData.constructor.name);
      console.log('[PDFium] savedPdfData length:', savedPdfData.length);

      // Return Blob directly from the Uint8Array
      const blob = new Blob([savedPdfData], { type: 'application/pdf' });
      console.log('[PDFium] Created blob:', blob);
      console.log('[PDFium] Blob size:', blob.size);
      console.log('[PDFium] Blob type:', blob.type);
      return blob;
    } finally {
      // Clean up memory
      pdfium.pdfium.wasmExports.free(filePtr);
      if (passwordPtr) pdfium.pdfium.wasmExports.free(passwordPtr);
    }
  } catch (err) {
    console.error('[PDFium] Direct decryption error:', err.message);
    throw err;
  }
};
