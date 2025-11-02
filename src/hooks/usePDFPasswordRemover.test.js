import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDFPasswordRemover } from './usePDFPasswordRemover';
import * as pdfjsLib from 'pdfjs-dist';

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  __esModule: true,
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '4.9.169',
  getDocument: jest.fn(),
  PasswordResponses: {
    NEED_PASSWORD: 1,
    INCORRECT_PASSWORD: 2,
  },
}));

// Mock jspdf
jest.mock('jspdf', () => {
  const mockJsPDF = jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    addPage: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob(['pdf content'], { type: 'application/pdf' })),
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(595),
      },
    },
  }));
  return {
    __esModule: true,
    default: mockJsPDF,
  };
});

describe('usePDFPasswordRemover', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    // Clear localStorage
    localStorage.clear();

    // Reset the getDocument mock
    pdfjsLib.getDocument.mockReset();

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock createElement for download link and canvas
    const createElement = document.createElement.bind(document);
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        const link = createElement('a');
        link.click = jest.fn();
        return link;
      }
      if (tag === 'canvas') {
        const canvas = createElement('canvas');
        const mockContext = {
          fillRect: jest.fn(),
          clearRect: jest.fn(),
          getImageData: jest.fn(() => ({ data: new Array(4) })),
          putImageData: jest.fn(),
          createImageData: jest.fn(() => []),
          setTransform: jest.fn(),
          drawImage: jest.fn(),
          save: jest.fn(),
          fillText: jest.fn(),
          restore: jest.fn(),
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          closePath: jest.fn(),
          stroke: jest.fn(),
          translate: jest.fn(),
          scale: jest.fn(),
          rotate: jest.fn(),
          arc: jest.fn(),
          fill: jest.fn(),
          measureText: jest.fn(() => ({ width: 0 })),
          transform: jest.fn(),
          rect: jest.fn(),
          clip: jest.fn(),
        };
        canvas.getContext = jest.fn(() => mockContext);
        canvas.toDataURL = jest.fn(() => 'data:image/png;base64,mockImageData');
        return canvas;
      }
      return createElement(tag);
    });

    // Store original getElementById
    const originalGetElementById = document.getElementById.bind(document);

    // Mock getElementById to prevent errors, but fallback to original
    document.getElementById = jest.fn((id) => {
      const element = originalGetElementById(id);
      return element || null;
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    // Clean up URL mocks
    delete global.URL.createObjectURL;
    delete global.URL.revokeObjectURL;
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    expect(result.current.file).toBeNull();
    expect(result.current.password).toBe('');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.fileName).toBe('');
  });

  it('updates file and fileName when handleFileChange is called', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.file).toBe(mockFile);
    expect(result.current.fileName).toBe('test.pdf');
    expect(result.current.error).toBe('');
  });

  it('clears error when file is selected', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    // First set an error by trying to remove password without file
    act(() => {
      result.current.handleRemovePassword();
    });

    expect(result.current.error).toBe('Please select a PDF file');

    // Then select a file
    const mockFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    expect(result.current.error).toBe('');
  });

  it('updates password when handlePasswordChange is called', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockEvent = {
      target: {
        value: 'test123',
      },
    };

    act(() => {
      result.current.handlePasswordChange(mockEvent);
    });

    expect(result.current.password).toBe('test123');
  });

  it('clears error when password is changed', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    // Set an error
    act(() => {
      result.current.handleRemovePassword();
    });

    expect(result.current.error).toBe('Please select a PDF file');

    // Change password
    const mockEvent = {
      target: {
        value: 'newpass',
      },
    };

    act(() => {
      result.current.handlePasswordChange(mockEvent);
    });

    expect(result.current.error).toBe('');
  });

  it('sets error when handleRemovePassword is called without file', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    act(() => {
      result.current.handleRemovePassword();
    });

    expect(result.current.error).toBe('Please select a PDF file');
    expect(result.current.isProcessing).toBe(false);
  });

  it('sets error when handleRemovePassword is called without password', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    act(() => {
      result.current.handleFileChange(mockEvent);
    });

    act(() => {
      result.current.handleRemovePassword();
    });

    expect(result.current.error).toBe('Please enter the PDF password');
    expect(result.current.isProcessing).toBe(false);
  });

  it('successfully removes password and downloads file', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFileArrayBuffer = new ArrayBuffer(8);
    const mockFile = new File(['dummy pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    // Setup PDF.js mocks (for password validation and rendering)
    const mockRenderTask = {
      promise: Promise.resolve(),
    };

    const mockPage = {
      getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
      render: jest.fn().mockReturnValue(mockRenderTask),
    };

    const mockPdfDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(mockPage),
      catalog: {},
      _pdfInfo: {},
    };

    const mockLoadingTask = {
      promise: Promise.resolve(mockPdfDocument),
      onPassword: null,
    };

    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);

    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.id = 'pdf-input';
    document.body.appendChild(fileInput);

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'password123' } });
    });

    await act(async () => {
      await result.current.handleRemovePassword();
    });

    await waitFor(() => {
      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({
        password: 'password123',
        data: expect.any(ArrayBuffer),
      });
    });

    expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 2 });
    expect(mockPage.render).toHaveBeenCalled();

    // Wait for all state updates to complete
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
    });

    // Verify download link was created and clicked
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('sets error when password is incorrect', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const mockFileArrayBuffer = new ArrayBuffer(8);
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    // Mock PDF.js getDocument to throw password error
    const passwordError = new Error('Incorrect password');
    passwordError.name = 'PasswordException';
    const mockLoadingTask = {
      promise: Promise.reject(passwordError),
    };
    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);
    // pdf-lib won't be called if PDF.js validation fails

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'wrongpass' } });
    });

    await act(async () => {
      await result.current.handleRemovePassword();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Incorrect password. Please try again.');
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it('sets error when PDF processing fails', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const mockFileArrayBuffer = new ArrayBuffer(8);
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    // Mock PDF.js getDocument to throw generic error
    const genericError = new Error('Failed to load PDF');
    const mockLoadingTask = {
      promise: Promise.reject(genericError),
    };
    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);
    // pdf-lib won't be called if PDF.js validation fails

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'password123' } });
    });

    await act(async () => {
      await result.current.handleRemovePassword();
    });

    await waitFor(() => {
      expect(result.current.error).toContain('Error processing PDF');
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it('sets isProcessing to true during PDF processing', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const mockFileArrayBuffer = new ArrayBuffer(8);
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    let resolveProcessing;
    const processingPromise = new Promise((resolve) => {
      resolveProcessing = resolve;
    });

    const mockRenderTask = {
      promise: Promise.resolve(),
    };

    const mockPage = {
      getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
      render: jest.fn().mockReturnValue(mockRenderTask),
    };

    const mockPdfDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(mockPage),
      catalog: {},
      _pdfInfo: {},
    };
    const mockLoadingTask = {
      promise: processingPromise.then(() => mockPdfDocument),
    };
    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);

    const fileInput = document.createElement('input');
    fileInput.id = 'pdf-input';
    document.body.appendChild(fileInput);

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'password123' } });
    });

    // Start the async operation without awaiting immediately
    let removePasswordPromise;
    act(() => {
      removePasswordPromise = result.current.handleRemovePassword();
    });

    // Check that isProcessing becomes true
    await waitFor(
      () => {
        expect(result.current.isProcessing).toBe(true);
      },
      { timeout: 1000 },
    );

    // Resolve the promise and wait for completion
    await act(async () => {
      resolveProcessing();
      await removePasswordPromise;
    });

    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
    });
  });

  it('handles file names with different case extensions', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy pdf content'], 'test.PDF', {
      type: 'application/pdf',
    });
    const mockFileArrayBuffer = new ArrayBuffer(8);
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    const mockRenderTask = {
      promise: Promise.resolve(),
    };

    const mockPage = {
      getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
      render: jest.fn().mockReturnValue(mockRenderTask),
    };

    const mockPdfDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(mockPage),
      catalog: {},
      _pdfInfo: {},
    };
    const mockLoadingTask = {
      promise: Promise.resolve(mockPdfDocument),
    };
    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);

    const fileInput = document.createElement('input');
    fileInput.id = 'pdf-input';
    document.body.appendChild(fileInput);

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'password123' } });
    });

    await act(async () => {
      await result.current.handleRemovePassword();
    });

    // Wait for processing to complete and state to update
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
    });

    // The link is created and removed, but we verify createElement was called for the anchor
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('clears error before processing', async () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const mockFile = new File(['dummy pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });
    const mockFileArrayBuffer = new ArrayBuffer(8);
    mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFileArrayBuffer);

    const mockEvent = {
      target: {
        files: [mockFile],
      },
    };

    // First set an error
    act(() => {
      result.current.handleRemovePassword();
    });
    expect(result.current.error).toBeTruthy();

    // Setup successful processing
    const mockRenderTask = {
      promise: Promise.resolve(),
    };

    const mockPage = {
      getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
      render: jest.fn().mockReturnValue(mockRenderTask),
    };

    const mockPdfDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(mockPage),
      catalog: {},
      _pdfInfo: {},
    };
    const mockLoadingTask = {
      promise: Promise.resolve(mockPdfDocument),
    };
    pdfjsLib.getDocument.mockReturnValue(mockLoadingTask);

    const fileInput = document.createElement('input');
    fileInput.id = 'pdf-input';
    document.body.appendChild(fileInput);

    act(() => {
      result.current.handleFileChange(mockEvent);
      result.current.handlePasswordChange({ target: { value: 'password123' } });
    });

    await act(async () => {
      await result.current.handleRemovePassword();
    });

    expect(result.current.error).toBe('');
  });

  it('loads saved password from localStorage on mount', () => {
    // Set up localStorage before rendering
    const testPassword = 'testPassword123';
    const encodedPassword = btoa(testPassword);
    localStorage.setItem('pdfPasswordRemover_data', JSON.stringify({ password: encodedPassword }));

    const { result } = renderHook(() => usePDFPasswordRemover());

    expect(result.current.password).toBe(testPassword);
  });

  it('saves password to localStorage when changed', () => {
    const { result } = renderHook(() => usePDFPasswordRemover());

    const testPassword = 'myNewPassword';
    const mockEvent = {
      target: {
        value: testPassword,
      },
    };

    act(() => {
      result.current.handlePasswordChange(mockEvent);
    });

    // Verify localStorage was updated
    const saved = localStorage.getItem('pdfPasswordRemover_data');
    expect(saved).toBeTruthy();
    const { password: savedPassword } = JSON.parse(saved);
    const decodedPassword = atob(savedPassword);
    expect(decodedPassword).toBe(testPassword);
    expect(result.current.password).toBe(testPassword);
  });
});
