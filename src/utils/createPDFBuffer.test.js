import { createPDFBuffer } from './createPDFBuffer';

describe('createPDFBuffer', () => {
  // Helper to mock arrayBuffer on a File instance
  const mockFileWithArrayBuffer = (content) => {
    const file = new File([content], 'test.pdf', { type: 'application/pdf' });
    file.arrayBuffer = jest.fn().mockResolvedValue(content.buffer);
    return file;
  };

  it('should correctly convert a File to an ArrayBuffer', async () => {
    const fileContent = new Uint8Array([1, 2, 3]);
    const file = mockFileWithArrayBuffer(fileContent);

    const result = await createPDFBuffer(file);

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result)).toEqual(fileContent);
  });

  it('should use slice(0) when available', async () => {
    const fileContent = new Uint8Array([1, 2, 3]);
    const file = mockFileWithArrayBuffer(fileContent);

    // Spy on ArrayBuffer.prototype.slice
    const sliceSpy = jest.spyOn(ArrayBuffer.prototype, 'slice');

    await createPDFBuffer(file);

    expect(sliceSpy).toHaveBeenCalledWith(0);
    sliceSpy.mockRestore();
  });

  it('should use fallback copy mechanism when slice throws an error', async () => {
    const fileContent = new Uint8Array([1, 2, 3]);
    const file = mockFileWithArrayBuffer(fileContent);

    // Mock slice to throw an error
    const sliceSpy = jest.spyOn(ArrayBuffer.prototype, 'slice').mockImplementation(() => {
      throw new Error('Slice failed');
    });

    // Spy on console.warn to suppress output during test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await createPDFBuffer(file);

    expect(sliceSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'copyArrayBuffer slice failed, using fallback copy',
      expect.any(Error),
    );
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result)).toEqual(fileContent);

    sliceSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should handle empty files correctly', async () => {
    const fileContent = new Uint8Array([]);
    const file = mockFileWithArrayBuffer(fileContent);

    const result = await createPDFBuffer(file);

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(0);
  });
});
