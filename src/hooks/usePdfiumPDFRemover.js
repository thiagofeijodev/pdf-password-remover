import { useState, useEffect } from 'react';
import { pdfiumRemover } from '../utils/pdfiumRemover';

/**
 * Hook for using pdfium.wasm for PDF password removal
 * Provides full PDF support with native password decryption
 */
export const usePdfiumPDFRemover = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // pdfium.wasm initializes on first use
    setIsLoading(false);
  }, []);

  /**
   * Process a PDF file and remove password encryption using pdfium.wasm
   * @param {ArrayBuffer} pdfData - The PDF file data as ArrayBuffer
   * @param {string} password - The password to use for decryption
   * @returns {Promise<ArrayBuffer>} The decrypted PDF data
   */
  const processPDFWithPdfium = async (pdfData, password) => {
    try {
      console.log('[Hook] Starting PDF processing with pdfium.wasm');
      console.log('[Hook] PDF size:', pdfData.byteLength, 'bytes');
      console.log('[Hook] Password length:', password.length, 'characters');

      // Try direct decryption first (faster if supported)
      let blob;
      try {
        console.log('[Hook] Attempting direct decryption...');
        blob = await pdfiumRemover(pdfData, password);
        console.log('[Hook] ✓ Direct decryption succeeded');
      } catch (directErr) {
        console.warn('[Hook] Direct decryption failed:', directErr.message);
      }

      console.log('[Hook] Output size:', blob.size, 'bytes');
      // Convert Blob to ArrayBuffer
      return blob;
    } catch (err) {
      console.error('[Hook] PDF processing error:', err);
      throw err;
    }
  };

  return {
    isLoading,
    processPDFWithPdfium,
    isPdfiumAvailable: !isLoading,
  };
};
