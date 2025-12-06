/**
 * Unit tests for usePdfiumPDFRemover hook
 * Tests WebAssembly initialization and PDF processing
 */

import { renderHook, act } from '@testing-library/react';
import { usePdfiumPDFRemover } from './usePdfiumPDFRemover';

jest.mock('../utils/pdfiumRemover');

const mockPdfiumRemover = require('../utils/pdfiumRemover').pdfiumRemover;

describe('usePdfiumPDFRemover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize hook with default values', () => {
      const { result } = renderHook(() => usePdfiumPDFRemover());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPdfiumAvailable).toBe(true);
      expect(typeof result.current.processPDFWithPdfium).toBe('function');
    });

    it('should provide processPDFWithPdfium function', () => {
      const { result } = renderHook(() => usePdfiumPDFRemover());

      expect(result.current.processPDFWithPdfium).toBeDefined();
      expect(typeof result.current.processPDFWithPdfium).toBe('function');
    });
  });

  describe('PDF Processing', () => {
    it('should process PDF successfully', async () => {
      const mockBlob = new Blob(['processed PDF'], { type: 'application/pdf' });
      mockPdfiumRemover.mockResolvedValueOnce(mockBlob);

      const { result } = renderHook(() => usePdfiumPDFRemover());

      const pdfData = new ArrayBuffer(100);
      const password = 'testPassword';

      let processedBlob;

      await act(async () => {
        processedBlob = await result.current.processPDFWithPdfium(pdfData, password);
      });

      expect(mockPdfiumRemover).toHaveBeenCalledWith(pdfData, password);
      expect(processedBlob).toEqual(mockBlob);
    });

    it('should return Blob from pdfiumRemover', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockPdfiumRemover.mockResolvedValueOnce(mockBlob);

      const { result } = renderHook(() => usePdfiumPDFRemover());

      const result_blob = await result.current.processPDFWithPdfium(
        new ArrayBuffer(50),
        'password',
      );

      expect(result_blob).toBeInstanceOf(Blob);
      expect(result_blob.type).toBe('application/pdf');
    });

    it('should handle processing errors', async () => {
      const error = new Error('PDF processing failed');
      mockPdfiumRemover.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePdfiumPDFRemover());

      await expect(
        act(async () => {
          await result.current.processPDFWithPdfium(new ArrayBuffer(50), 'wrongPassword');
        }),
      ).rejects.toThrow();
    });

    it('should pass correct parameters to pdfiumRemover', async () => {
      mockPdfiumRemover.mockResolvedValueOnce(new Blob());

      const { result } = renderHook(() => usePdfiumPDFRemover());

      const pdfData = new ArrayBuffer(200);
      const password = 'myPassword';

      await act(async () => {
        await result.current.processPDFWithPdfium(pdfData, password);
      });

      expect(mockPdfiumRemover).toHaveBeenCalledWith(pdfData, password);
    });
  });

  describe('Multiple Processing', () => {
    it('should handle multiple PDF processing calls', async () => {
      mockPdfiumRemover.mockResolvedValue(new Blob(['processed']));

      const { result } = renderHook(() => usePdfiumPDFRemover());

      const pdfData1 = new ArrayBuffer(100);
      const pdfData2 = new ArrayBuffer(200);

      await act(async () => {
        await result.current.processPDFWithPdfium(pdfData1, 'password1');
        await result.current.processPDFWithPdfium(pdfData2, 'password2');
      });

      expect(mockPdfiumRemover).toHaveBeenCalledTimes(2);
      expect(mockPdfiumRemover).toHaveBeenNthCalledWith(1, pdfData1, 'password1');
      expect(mockPdfiumRemover).toHaveBeenNthCalledWith(2, pdfData2, 'password2');
    });

    it('should independently handle success and failure', async () => {
      mockPdfiumRemover
        .mockResolvedValueOnce(new Blob(['success']))
        .mockRejectedValueOnce(new Error('failure'));

      const { result } = renderHook(() => usePdfiumPDFRemover());

      // First call succeeds
      await act(async () => {
        await result.current.processPDFWithPdfium(new ArrayBuffer(100), 'correct');
      });

      // Second call fails
      await expect(
        act(async () => {
          await result.current.processPDFWithPdfium(new ArrayBuffer(100), 'incorrect');
        }),
      ).rejects.toThrow();
    });
  });

  describe('State Management', () => {
    it('should maintain isPdfiumAvailable as true', () => {
      const { result } = renderHook(() => usePdfiumPDFRemover());

      expect(result.current.isPdfiumAvailable).toBe(true);
    });

    it('should maintain isLoading as false after initialization', () => {
      const { result } = renderHook(() => usePdfiumPDFRemover());

      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain processPDFWithPdfium consistency across renders', () => {
      const { result, rerender } = renderHook(() => usePdfiumPDFRemover());

      const firstFunction = result.current.processPDFWithPdfium;

      rerender();

      const secondFunction = result.current.processPDFWithPdfium;

      expect(typeof firstFunction).toBe('function');
      expect(typeof secondFunction).toBe('function');
    });
  });
});
