jest.mock('./libheifConverter', () => ({
  __esModule: true,
  convertHeicToBrowserBlob: jest.fn(),
  preloadHeicDecoder: jest.fn(),
}));

import { convertHeicToBrowserBlob, preloadHeicDecoder } from './libheifConverter';
import { heicToPng, heicToPngUnderSize, initWasm } from './rustHeicConverter';

describe('rustHeicConverter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preloads the HEIC decoder through initWasm', async () => {
    preloadHeicDecoder.mockResolvedValue(true);

    await initWasm();

    expect(preloadHeicDecoder).toHaveBeenCalled();
  });

  it('delegates HEIC to PNG conversion to the browser libheif converter', async () => {
    convertHeicToBrowserBlob.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));

    const blob = await heicToPng(new ArrayBuffer(8));

    expect(convertHeicToBrowserBlob).toHaveBeenCalledWith(expect.any(ArrayBuffer), {});
    expect(blob.type).toBe('image/png');
  });

  it('passes size limits through the compressed conversion path', async () => {
    convertHeicToBrowserBlob.mockResolvedValue(new Blob(['jpg'], { type: 'image/jpeg' }));

    const blob = await heicToPngUnderSize(new ArrayBuffer(8), 1024);

    expect(convertHeicToBrowserBlob).toHaveBeenCalledWith(expect.any(ArrayBuffer), {
      maxBytes: 1024,
    });
    expect(blob.type).toBe('image/jpeg');
  });
});
