import { useState, useEffect } from 'react';
import { rustPdfRemover, initWasm } from '../utils/rustPdfRemover';

/**
 * Hook for using Rust WASM for PDF password removal
 */
export const useRustPDFRemover = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initWasm();
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize Rust WASM:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  /**
   * Process a PDF file and remove password encryption using Rust WASM
   * @param {ArrayBuffer} pdfData - The PDF file data as ArrayBuffer
   * @param {string} password - The password to use for decryption
   * @returns {Promise<Blob>} The decrypted PDF data as Blob
   */
  const processPDFWithRust = async (pdfData, password) => {
    try {
      console.log('[Hook] Starting PDF processing with Rust WASM');
      const blob = await rustPdfRemover(pdfData, password);
      console.log('[Hook] Processing successful');
      return blob;
    } catch (err) {
      console.error('[Hook] PDF processing error:', err);
      throw err;
    }
  };

  return {
    isLoading,
    processPDFWithRust,
    isReady,
  };
};
