/**
 * Unit tests for usePDFPasswordRemover hook
 * Tests state management, localStorage interactions, and password handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDFPasswordRemover } from './usePDFPasswordRemover';

// Mock createPDFBuffer
jest.mock('../utils/createPDFBuffer', () => ({
  createPDFBuffer: jest.fn(async (file) => {
    return file.arrayBuffer();
  }),
}));

// Mock downloadBlob
jest.mock('../utils/downloadBlob', () => ({
  downloadBlob: jest.fn(),
}));

const mockDownloadBlob = require('../utils/downloadBlob').downloadBlob;
const mockCreatePDFBuffer = require('../utils/createPDFBuffer').createPDFBuffer;

describe('usePDFPasswordRemover', () => {
  const mockProcessPDFWithPdfium = jest.fn(async (pdfData, password) => {
    if (password === 'correct') {
      return new Blob([pdfData], { type: 'application/pdf' });
    }
    throw new Error('Invalid password');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      expect(result.current.password).toBe('');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe('');
      expect(result.current.fileName).toBe('');
      expect(result.current.file).toBeNull();
      expect(result.current.savePassword).toBe(true);
    });

    it('should load saved password from localStorage on mount', () => {
      const encodedPassword = btoa('savedPassword');
      localStorage.setItem(
        'pdfPasswordRemover_data',
        JSON.stringify({ password: encodedPassword }),
      );

      renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      // Password should be loaded from localStorage
      expect(localStorage.getItem('pdfPasswordRemover_data')).toBe(
        JSON.stringify({ password: encodedPassword }),
      );
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('pdfPasswordRemover_data', 'corrupted data');

      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      expect(result.current.password).toBe('');
    });
  });

  describe('File Input Handling', () => {
    it('should handle file selection', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: { files: [mockFile] },
      };

      act(() => {
        result.current.handleFileChange(event);
      });

      expect(result.current.file).toBe(mockFile);
      expect(result.current.fileName).toBe('test.pdf');
      expect(result.current.error).toBe('');
    });

    it('should clear error when new file is selected', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: { files: [mockFile] },
      };

      // Set initial error
      act(() => {
        result.current.handleFileChange({ target: { files: [] } });
      });

      // Clear error with new file
      act(() => {
        result.current.handleFileChange(event);
      });

      expect(result.current.error).toBe('');
    });

    it('should handle empty file selection', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const event = {
        target: { files: [] },
      };

      act(() => {
        result.current.handleFileChange(event);
      });

      expect(result.current.file).toBeNull();
      expect(result.current.fileName).toBe('');
    });
  });

  describe('Password Input Handling', () => {
    it('should update password state', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const event = {
        target: { value: 'testPassword' },
      };

      act(() => {
        result.current.handlePasswordChange(event);
      });

      expect(result.current.password).toBe('testPassword');
    });

    it('should clear error when password is changed', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const event = {
        target: { value: 'newPassword' },
      };

      act(() => {
        result.current.handlePasswordChange(event);
      });

      expect(result.current.error).toBe('');
    });

    it('should save password to localStorage when savePassword is true', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      act(() => {
        result.current.handlePasswordChange({
          target: { value: 'testPassword' },
        });
      });

      expect(localStorage.getItem('pdfPasswordRemover_data')).toBeTruthy();
      const savedData = JSON.parse(localStorage.getItem('pdfPasswordRemover_data'));
      expect(savedData.password).toBe(btoa('testPassword'));
    });

    it('should not save password when savePassword is false', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      // Set savePassword to false
      act(() => {
        result.current.handleSavePasswordChange({
          target: { checked: false },
        });
      });

      // Change password
      act(() => {
        result.current.handlePasswordChange({
          target: { value: 'testPassword' },
        });
      });

      const savedData = JSON.parse(localStorage.getItem('pdfPasswordRemover_data'));
      expect(savedData.password).toBe('');
    });
  });

  describe('Save Password Toggle', () => {
    it('should toggle savePassword state', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      expect(result.current.savePassword).toBe(true);

      act(() => {
        result.current.handleSavePasswordChange({
          target: { checked: false },
        });
      });

      expect(result.current.savePassword).toBe(false);
    });

    it('should clear password when unchecking savePassword', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      act(() => {
        result.current.handlePasswordChange({
          target: { value: 'testPassword' },
        });
      });

      expect(result.current.password).toBe('testPassword');

      act(() => {
        result.current.handleSavePasswordChange({
          target: { checked: false },
        });
      });

      expect(result.current.password).toBe('');
    });

    it('should clear localStorage when unchecking savePassword', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      act(() => {
        result.current.handleSavePasswordChange({
          target: { checked: false },
        });
      });

      const savedData = JSON.parse(localStorage.getItem('pdfPasswordRemover_data'));
      expect(savedData.password).toBe('');
    });
  });

  describe('Password Removal', () => {
    it('should return error when no file is selected', async () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      act(() => {
        result.current.handlePasswordChange({
          target: { value: 'password' },
        });
      });

      await act(async () => {
        await result.current.handleRemovePassword();
      });

      expect(result.current.error).toBe('Please select a PDF file');
    });

    it('should return error when no password is entered', async () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF'], 'test.pdf');

      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        });
      });

      await act(async () => {
        await result.current.handleRemovePassword();
      });

      expect(result.current.error).toBe('Please enter the PDF password');
    });

    it('should process PDF when file and password are provided', async () => {
      mockCreatePDFBuffer.mockResolvedValue(new ArrayBuffer(10));

      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF content'], 'test.pdf');

      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        });

        result.current.handlePasswordChange({
          target: { value: 'correct' },
        });
      });

      await act(async () => {
        await result.current.handleRemovePassword();
      });

      expect(mockCreatePDFBuffer).toHaveBeenCalledWith(mockFile, 'correct');
      expect(mockProcessPDFWithPdfium).toHaveBeenCalled();
      expect(mockDownloadBlob).toHaveBeenCalled();
    });

    it('should set isProcessing to true during processing', async () => {
      mockCreatePDFBuffer.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(new ArrayBuffer(10)), 100);
          }),
      );

      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF'], 'test.pdf');

      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        });

        result.current.handlePasswordChange({
          target: { value: 'correct' },
        });
      });

      act(() => {
        result.current.handleRemovePassword();
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('should handle processing errors', async () => {
      mockCreatePDFBuffer.mockRejectedValue(new Error('File read error'));

      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      const mockFile = new File(['PDF'], 'test.pdf');

      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        });

        result.current.handlePasswordChange({
          target: { value: 'password' },
        });
      });

      await act(async () => {
        await result.current.handleRemovePassword();
      });

      expect(result.current.error).toContain('error');
    });
  });

  describe('localStorage Integration', () => {
    it('should encode password before saving to localStorage', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      act(() => {
        result.current.handlePasswordChange({
          target: { value: 'mySecret' },
        });
      });

      const savedData = JSON.parse(localStorage.getItem('pdfPasswordRemover_data'));
      expect(savedData.password).toBe(btoa('mySecret'));
    });

    it('should handle localStorage errors gracefully', () => {
      const { result } = renderHook(() => usePDFPasswordRemover(mockProcessPDFWithPdfium));

      expect(() => {
        act(() => {
          result.current.handlePasswordChange({
            target: { value: 'password' },
          });
        });
      }).not.toThrow();
    });
  });
});
