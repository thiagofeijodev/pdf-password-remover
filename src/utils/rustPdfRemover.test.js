jest.mock('./workerWasmClient', () => ({
  __esModule: true,
  default: {
    isSupported: jest.fn(),
    processPdf: jest.fn(),
  },
}));

jest.mock('../wasm/rust_pdf_remover.js', () => ({
  __esModule: true,
  default: jest.fn(async () => ({})),
  init_panic_hook: jest.fn(),
  remove_password: jest.fn(),
}));

import workerClient from './workerWasmClient';
import init, { remove_password } from '../wasm/rust_pdf_remover.js';
import { rustPdfRemover } from './rustPdfRemover';

describe('rustPdfRemover', () => {
  let warnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('uses the worker result when the worker path succeeds', async () => {
    workerClient.isSupported.mockReturnValue(true);
    workerClient.processPdf.mockResolvedValue({
      result: new Uint8Array([1, 2, 3]).buffer,
      mimeType: 'application/pdf',
    });

    const blob = await rustPdfRemover(new ArrayBuffer(8), 'secret');

    expect(workerClient.processPdf).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'secret', {});
    expect(init).not.toHaveBeenCalled();
    expect(blob.type).toBe('application/pdf');
  });

  it('falls back to main-thread WASM when the worker path fails', async () => {
    workerClient.isSupported.mockReturnValue(true);
    workerClient.processPdf.mockRejectedValue(new Error('Worker unavailable'));
    remove_password.mockReturnValue(new Uint8Array([9, 8, 7]));

    const blob = await rustPdfRemover(new ArrayBuffer(8), 'secret');

    expect(workerClient.processPdf).toHaveBeenCalled();
    expect(init).toHaveBeenCalled();
    expect(remove_password).toHaveBeenCalledWith(expect.any(Uint8Array), 'secret');
    expect(blob.type).toBe('application/pdf');
  });
});
