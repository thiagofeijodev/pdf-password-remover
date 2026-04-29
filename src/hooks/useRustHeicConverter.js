import { useEffect, useState } from 'react';
import { initWasm, heicToPng, heicToPngUnderSize } from '../utils/rustHeicConverter';

/**
 * Hook for converting HEIC images to PNG using Rust WASM
 * Manages WASM initialization and provides image conversion functionality
 */
export function useRustHeicConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(null);
  const [progressStage, setProgressStage] = useState(null);

  // Initialize WASM module on component mount
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        console.log('[Hook] Initializing HEIC converter WASM...');
        // Skip heavy WASM initialization during tests to avoid network/instantiation issues
        if (process.env.NODE_ENV !== 'test') {
          await initWasm();
        }
        setIsReady(true);
        console.log('[Hook] HEIC converter WASM ready');
      } catch (error) {
        console.warn('[Hook] WASM initialization attempted (may fail safely)', error.message);
        // Still mark as ready - actual error handling happens during conversion
        setIsReady(true);
      }
    };

    initializeWasm();
  }, []);

  /**
   * Process HEIC image and convert to PNG
   * @param {ArrayBuffer} imageData - Raw image data
   * @returns {Promise<Blob>} PNG image blob
   */
  async function processHeicWithRust(imageData, options = {}) {
    setIsLoading(true);
    setProgress(null);
    setProgressStage('starting');

    const onProgress = (msg) => {
      setProgress(msg.percent ?? null);
      setProgressStage(msg.stage ?? null);
    };

    try {
      console.log('[Hook] Processing HEIC image...');
      let pngBlob;
      if (options && options.compressToUnder2MB) {
        pngBlob = await heicToPngUnderSize(imageData, 2 * 1024 * 1024, { onProgress });
      } else {
        pngBlob = await heicToPng(imageData, { onProgress });
      }
      setProgressStage('done');
      console.log('[Hook] HEIC conversion successful');
      return pngBlob;
    } catch (error) {
      console.error('[Hook] HEIC conversion error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    processHeicWithRust,
    isReady,
    progress,
    progressStage,
  };
}
