import { useState, useEffect } from 'react';
import { rustPdfRemover, initWasm } from '../utils/rustPdfRemover';
import workerClient from '../utils/workerWasmClient';

/**
 * Hook for using Rust WASM for PDF password removal
 */
export const useRustPDFRemover = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(null);
  const [progressStage, setProgressStage] = useState(null);

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

  useEffect(() => {
    if (!workerClient || !workerClient.isSupported()) return undefined;
    const off = workerClient.onProgress((id, msg) => {
      setProgress(msg.percent ?? null);
      setProgressStage(msg.stage ?? null);
    });
    return off;
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
      setProgress(null);
      setProgressStage('starting');
      const blob = await rustPdfRemover(pdfData, password);
      setProgressStage('done');
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
    progress,
    progressStage,
  };
};
