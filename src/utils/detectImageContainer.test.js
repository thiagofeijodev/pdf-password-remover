import { detectImageContainer, getUnsupportedHeicMessage } from './detectImageContainer';

describe('detectImageContainer', () => {
  it('detects PNG signatures', () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]).buffer;
    expect(detectImageContainer(buffer)).toEqual({ format: 'png', label: 'PNG' });
  });

  it('detects JPEG signatures', () => {
    const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xee, 0, 0]).buffer;
    expect(detectImageContainer(buffer)).toEqual({ format: 'jpeg', label: 'JPEG' });
  });

  it('detects HEIC brands', () => {
    const buffer = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])
      .buffer;
    expect(detectImageContainer(buffer)).toEqual({ format: 'heic', label: 'HEIC', brand: 'heic' });
  });

  it('builds honest messages for mislabeled PNGs', () => {
    expect(getUnsupportedHeicMessage('photo.heic', { format: 'png', label: 'PNG' })).toBe(
      'The selected file is actually a PNG image, not a HEIC file.',
    );
  });

  it('builds fallback messages for unknown files', () => {
    expect(getUnsupportedHeicMessage('photo.heic', { format: 'unknown', label: 'unknown' })).toBe(
      'The selected file could not be identified as a supported HEIC image: photo.heic',
    );
  });
});
