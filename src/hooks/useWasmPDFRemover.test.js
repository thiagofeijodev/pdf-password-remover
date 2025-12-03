import { renderHook, waitFor } from '@testing-library/react';
import { useWasmPDFRemover } from './useWasmPDFRemover';

// Mock the dynamic import
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('useWasmPDFRemover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useWasmPDFRemover());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.wasmModule).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('handles WASM loading failure gracefully', async () => {
    const { result } = renderHook(() => useWasmPDFRemover());

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // In test environment, WASM module will fail to load
    // Hook should handle this gracefully
    expect(result.current.wasmModule).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns isWasmAvailable as false when WASM is not loaded', async () => {
    const { result } = renderHook(() => useWasmPDFRemover());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isWasmAvailable).toBe(false);
  });

  it('processPDFWithWasm throws when WASM is not available', async () => {
    const { result } = renderHook(() => useWasmPDFRemover());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const testData = new ArrayBuffer(10);
    await expect(result.current.processPDFWithWasm(testData, 'test-password')).rejects.toThrow(
      'WASM module not loaded',
    );
  });
});
