const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function hasSignature(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

function readBrand(bytes) {
  if (bytes.length < 12) return null;
  const boxType = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (boxType !== 'ftyp') return null;
  return String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
}

export function detectImageContainer(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 32));

  if (hasSignature(bytes, PNG_SIGNATURE)) {
    return { format: 'png', label: 'PNG' };
  }

  if (hasSignature(bytes, JPEG_SIGNATURE)) {
    return { format: 'jpeg', label: 'JPEG' };
  }

  const brand = readBrand(bytes);
  if (!brand) {
    return { format: 'unknown', label: 'unknown' };
  }

  if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) {
    return { format: 'heic', label: 'HEIC', brand };
  }

  if (['mif1', 'msf1', 'heif'].includes(brand)) {
    return { format: 'heif', label: 'HEIF', brand };
  }

  if (['avif', 'avis'].includes(brand)) {
    return { format: 'avif', label: 'AVIF', brand };
  }

  return { format: 'unknown', label: 'unknown', brand };
}

export function getUnsupportedHeicMessage(fileName, detected) {
  if (detected.format === 'png' || detected.format === 'jpeg') {
    return `The selected file is actually a ${detected.label} image, not a HEIC file.`;
  }

  if (detected.format === 'avif') {
    return 'This file is AVIF, not HEIC. AVIF conversion is not supported here.';
  }

  return `The selected file could not be identified as a supported HEIC image: ${fileName}`;
}
