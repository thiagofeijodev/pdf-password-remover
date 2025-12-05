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

// Constants
const PDFIUM_WASM_URL = 'https://feijo.dev/pdf-password-remover/pdfium.wasm';
const FPDF_REMOVE_SECURITY = 3;
const FPDF_ERROR_PASSWORD_REQUIRED = 4;
const FPDF_ERROR_NO_ERROR = 0;
const FPDF_ERROR_UNKNOWN = 1;
const FILEWRITE_STRUCT_SIZE = 8; // 4 bytes version + 4 bytes function pointer
const FILEWRITE_VERSION = 1;
const FILEWRITE_CALLBACK_SUCCESS = 1;
const FILEWRITE_CALLBACK_FAILURE = 0;

let pdfiumInstance = null;

/**
 * Initialize pdfium WebAssembly module
 */
const initPdfium = async () => {
  if (pdfiumInstance) return pdfiumInstance;

  try {
    const response = await fetch(PDFIUM_WASM_URL);
    const wasmBinary = await response.arrayBuffer();

    pdfiumInstance = await init({ wasmBinary });
    pdfiumInstance.PDFiumExt_Init();

    return pdfiumInstance;
  } catch (err) {
    console.error('[PDFium] Failed to initialize:', err);
    throw err;
  }
};

/**
 * Remove password from encrypted PDF using FPDF_SaveAsCopy
 * @param {ArrayBuffer} pdfData - PDF file as ArrayBuffer
 * @param {string} password - PDF password
 * @returns {Promise<Blob>} - Decrypted PDF as Blob
 */
export const pdfiumRemover = async (pdfData, password) => {
  const pdfium = await initPdfium();
  const wasmExports = pdfium.pdfium.wasmExports;
  const wasmMemory = pdfium.pdfium.wasmExports.memory.buffer;

  // Allocate memory for PDF data
  const pdfSize = pdfData.byteLength;
  const filePtr = wasmExports.malloc(pdfSize);
  const heapBytes = new Uint8Array(wasmMemory, filePtr, pdfSize);
  heapBytes.set(new Uint8Array(pdfData));

  // Use password string directly or undefined for no password
  const passwordPtr = password || 0;

  try {
    // Load PDF document with password
    const docPtr = pdfium.FPDF_LoadMemDocument(filePtr, pdfSize, passwordPtr);

    if (!docPtr) {
      const errorCode = pdfium.FPDF_GetLastError();

      if (errorCode === FPDF_ERROR_PASSWORD_REQUIRED) {
        throw new Error('Password required or incorrect password');
      }
      if (errorCode === FPDF_ERROR_NO_ERROR || errorCode === FPDF_ERROR_UNKNOWN) {
        // PDF has no password or error loading, return as-is
        return new Blob([pdfData], { type: 'application/pdf' });
      }
      throw new Error(`Failed to load PDF: error code ${errorCode}`);
    }

    // Verify document is accessible
    const pageCount = pdfium.FPDF_GetPageCount(docPtr);
    if (pageCount <= 0) {
      throw new Error('Invalid PDF or unable to access pages');
    }

    // Collect PDF output chunks
    const savedPdfChunks = [];

    // Create FPDF_FILEWRITE structure
    const fileWritePtr = wasmExports.malloc(FILEWRITE_STRUCT_SIZE);
    const view = new DataView(wasmMemory);
    view.setInt32(fileWritePtr, FILEWRITE_VERSION, true);

    // Write callback for PDF chunks
    const writeBlockCallback = pdfium.pdfium.addFunction((pThis, dataPtr, size) => {
      try {
        const data = new Uint8Array(wasmMemory, dataPtr, size);
        savedPdfChunks.push(new Uint8Array(data));
        return FILEWRITE_CALLBACK_SUCCESS;
      } catch (err) {
        console.error('[PDFium] WriteBlock error:', err);
        return FILEWRITE_CALLBACK_FAILURE;
      }
    }, 'iiii');

    view.setInt32(fileWritePtr + 4, writeBlockCallback, true);

    // Save PDF without security
    const saveResult = pdfium.FPDF_SaveAsCopy(docPtr, fileWritePtr, FPDF_REMOVE_SECURITY);

    if (!saveResult) {
      throw new Error('Failed to save PDF copy');
    }

    // Combine chunks into single buffer
    const totalSize = savedPdfChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const savedPdfData = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of savedPdfChunks) {
      savedPdfData.set(chunk, offset);
      offset += chunk.length;
    }

    // Cleanup
    pdfium.pdfium.removeFunction(writeBlockCallback);
    wasmExports.free(fileWritePtr);
    pdfium.FPDF_CloseDocument(docPtr);

    return new Blob([savedPdfData], { type: 'application/pdf' });
  } catch (err) {
    console.error('[PDFium] Decryption error:', err.message);
    throw err;
  } finally {
    // Always clean up allocated memory
    wasmExports.free(filePtr);
  }
};
