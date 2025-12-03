import { useState, useEffect } from 'react';

/**
 * Hook for using the WebAssembly PDF password remover
 * Falls back to JavaScript-based removal if WASM is not available
 */
export const useWasmPDFRemover = () => {
  const [wasmModule, setWasmModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        // Import the WASM module from the public directory
        // The module initializes with a locateFile function that tells it where to find the .wasm binary
        const wasmModule = await import(
          /* webpackIgnore: true */ '/pdf-password-remover/pdf-remover.js'
        );

        // Initialize the WASM module with proper file location
        const module = await wasmModule.default({
          locateFile: (filename) => {
            // Tell the WASM loader where to find files relative to app root
            if (filename.endsWith('.wasm')) {
              return `${window.location.origin}/pdf-password-remover/${filename}`;
            }
            return filename;
          },
        });

        setWasmModule(module);
        setError(null);
      } catch (err) {
        console.warn('Failed to load WASM module, will use fallback:', err);
        setError(err.message);
        // Module will be null, but hook will still work with fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadWasm();
  }, []);

  /**
   * Process a PDF file and remove password encryption using WASM
   * @param {ArrayBuffer} pdfData - The PDF file data as ArrayBuffer
   * @param {string} password - The password to use for decryption
   * @returns {Promise<ArrayBuffer>} The decrypted PDF data
   */
  const processPDFWithWasm = async (pdfData, password) => {
    if (!wasmModule) {
      throw new Error('WASM module not loaded. Use fallback method.');
    }

    try {
      // Create remover instance
      const remover = new wasmModule.PDFRemover();

      // Convert ArrayBuffer to Uint8Array for WASM
      const uint8Array = new Uint8Array(pdfData);

      // Process the PDF
      const success = remover.processPDF(uint8Array, password);

      if (!success) {
        throw new Error('Failed to process PDF with WASM');
      }

      // Get the output
      const output = remover.getOutput();

      // Convert Uint8Array back to ArrayBuffer
      return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
    } catch (err) {
      console.error('WASM PDF processing error:', err);
      throw err;
    }
  };

  return {
    wasmModule,
    isLoading,
    error,
    processPDFWithWasm,
    isWasmAvailable: wasmModule !== null,
  };
};
