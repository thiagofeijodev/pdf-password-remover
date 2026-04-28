import { useEffect, useState } from 'react';
import { initWasm, heicToPng, heicToPngUnderSize } from '../utils/rustHeicConverter';

export function useRustHeicConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeWasm = async () => {
      try {
        if (process.env.NODE_ENV !== 'test') {
          await initWasm();
        }
        setIsReady(true);
      } catch (error) {
        setInitError(error.message || 'Failed to initialize HEIC converter');
        setIsReady(true);
      }
    };

    initializeWasm();
  }, []);

  async function processHeicWithRust(imageData, options = {}) {
    setIsLoading(true);

    try {
      let pngBlob;
      if (options && options.compressToUnder2MB) {
        pngBlob = await heicToPngUnderSize(imageData, 2 * 1024 * 1024);
      } else {
        pngBlob = await heicToPng(imageData);
      }
      return pngBlob;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    processHeicWithRust,
    isReady,
    initError,
  };
}
