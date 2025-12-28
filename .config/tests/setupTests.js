/**
 * Jest Setup File
 * Configures test environment, mocks, and global test utilities
 */

import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for WebAssembly and other HTTP requests
global.fetch = jest.fn((url) => {
  // Mock pdfium.wasm request
  if (url.includes('pdfium.wasm')) {
    return Promise.resolve({
      ok: true,
      arrayBuffer: async () => {
        // Create a minimal valid WebAssembly module binary
        const wasmModule = new Uint8Array([
          0x00,
          0x61,
          0x73,
          0x6d, // Magic number "\0asm"
          0x01,
          0x00,
          0x00,
          0x00, // Version
        ]);
        return wasmModule.buffer;
      },
    });
  }
  // Default mock response
  return Promise.reject(new Error(`Unmocked fetch: ${url}`));
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn((blob) => {
  return `blob:http://localhost/${Math.random()}`;
});

global.URL.revokeObjectURL = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage with proper jest mock implementation
const localStorageMock = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = String(value);
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console output during tests (optional)
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Could not find React DevTools'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
  console.warn = jest.fn((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('act')) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
