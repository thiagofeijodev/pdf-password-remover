import { useEffect, useState } from 'react';
import { heicToPng, heicToPngUnderSize } from '../utils/rustHeicConverter';
import { preloadHeicDecoder } from '../utils/libheifConverter';

/**
 * Hook for converting HEIC images in the browser using libheif
 */
export function useRustHeicConverter() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const warmDecoder = async () => {
      try {
        await preloadHeicDecoder();
      } catch (err) {
        if (!cancelled) {
          console.warn('[Hook] Failed to prewarm HEIC decoder:', err);
        }
      }
    };

    const idleCallback =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => {
            void warmDecoder();
          })
        : window.setTimeout(() => {
            void warmDecoder();
          }, 0);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback);
      }
    };
  }, []);

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
