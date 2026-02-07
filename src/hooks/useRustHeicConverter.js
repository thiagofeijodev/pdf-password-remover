import { useEffect, useState } from 'react';
import { initWasm, heicToPng } from '../utils/rustHeicConverter';

/**
 * Hook for converting HEIC images to PNG using Rust WASM
 * Manages WASM initialization and provides image conversion functionality
 */
export function useRustHeicConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize WASM module on component mount
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        console.log('[Hook] Initializing HEIC converter WASM...');
        await initWasm();
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
  async function processHeicWithRust(imageData) {
    setIsLoading(true);
    try {
      console.log('[Hook] Processing HEIC image...');
      const pngBlob = await heicToPng(imageData);
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
  };
}
