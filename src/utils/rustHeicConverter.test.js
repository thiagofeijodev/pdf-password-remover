jest.mock('./workerWasmClient', () => ({
  __esModule: true,
  default: {
    isSupported: jest.fn(),
    processHeic: jest.fn(),
  },
}));

jest.mock('../wasm-heic/rust_heic_converter.js', () => ({
  __esModule: true,
  default: jest.fn(async () => ({})),
  init_panic_hook: jest.fn(),
  convert_heic_to_png: jest.fn(),
  convert_heic_to_png_under_size: jest.fn(),
}));

import workerClient from './workerWasmClient';
import init, {
  convert_heic_to_png,
  convert_heic_to_png_under_size,
} from '../wasm-heic/rust_heic_converter.js';
import { heicToPng, heicToPngUnderSize } from './rustHeicConverter';

describe('rustHeicConverter', () => {
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
    workerClient.processHeic.mockResolvedValue({
      result: new Uint8Array([1, 2, 3]).buffer,
      mimeType: 'image/png',
    });

    const blob = await heicToPng(new ArrayBuffer(8));

    expect(workerClient.processHeic).toHaveBeenCalledWith(expect.any(ArrayBuffer), {});
    expect(init).not.toHaveBeenCalled();
    expect(blob.type).toBe('image/png');
  });

  it('falls back to main-thread conversion when the worker path fails', async () => {
    workerClient.isSupported.mockReturnValue(true);
    workerClient.processHeic.mockRejectedValue(new Error('Worker unavailable'));
    convert_heic_to_png.mockReturnValue(new Uint8Array([4, 5, 6]));

    const blob = await heicToPng(new ArrayBuffer(8));

    expect(workerClient.processHeic).toHaveBeenCalled();
    expect(init).toHaveBeenCalled();
    expect(convert_heic_to_png).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(blob.type).toBe('image/png');
  });

  it('falls back for size-constrained conversion when the worker path fails', async () => {
    workerClient.isSupported.mockReturnValue(true);
    workerClient.processHeic.mockRejectedValue(new Error('Worker unavailable'));
    convert_heic_to_png_under_size.mockReturnValue(new Uint8Array([7, 8, 9]));

    const blob = await heicToPngUnderSize(new ArrayBuffer(8), 1024);

    expect(workerClient.processHeic).toHaveBeenCalledWith(expect.any(ArrayBuffer), {
      maxBytes: 1024,
    });
    expect(convert_heic_to_png_under_size).toHaveBeenCalledWith(expect.any(Uint8Array), 1024);
    expect(blob.type).toBe('image/png');
  });
});
