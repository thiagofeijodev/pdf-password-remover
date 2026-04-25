import { convertHeicToBrowserBlob, preloadHeicDecoder } from './libheifConverter';

export const initWasm = async () => preloadHeicDecoder();

export const heicToPng = async (heicData, opts = {}) => {
  return convertHeicToBrowserBlob(heicData, opts);
};

export const heicToPngUnderSize = async (heicData, maxBytes = 2 * 1024 * 1024, opts = {}) => {
  return convertHeicToBrowserBlob(heicData, { ...opts, maxBytes });
};
