import { useState, useEffect } from 'react';
import { rustPdfRemover, initWasm } from '../utils/rustPdfRemover';

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

  const processPDFWithRust = async (pdfData, password) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const blob = await rustPdfRemover(pdfData, password);
      return blob;
    } catch (err) {
      throw err;
    }
  };

  return {
    isLoading,
    processPDFWithRust,
    isReady,
  };
};
