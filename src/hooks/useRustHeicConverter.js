import { useState } from 'react';
import { heicToPng, heicToPngUnderSize } from '../utils/rustHeicConverter';

/**
 * Hook for converting HEIC images to PNG using Rust WASM
 * Manages WASM initialization and provides image conversion functionality
 */
export function useRustHeicConverter() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Process HEIC image and convert to PNG
   * @param {ArrayBuffer} imageData - Raw image data
   * @returns {Promise<Blob>} PNG image blob
   */
  async function processHeicWithRust(imageData, options = {}) {
    setIsLoading(true);

    try {
      console.log('[Hook] Processing HEIC image...');
      let pngBlob;
      if (options && options.compressToUnder2MB) {
        pngBlob = await heicToPngUnderSize(imageData, 2 * 1024 * 1024);
      } else {
        pngBlob = await heicToPng(imageData);
      }
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
    isReady: true,
  };
}
