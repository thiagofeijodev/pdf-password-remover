import { useState } from 'react';
import { useRustHeicConverter } from './useRustHeicConverter';
import { createSafeBuffer } from '../utils/createSafeBuffer';
import { downloadBlob } from '../utils/downloadBlob';
import { cancelHeicConversion } from '../utils/rustHeicConverter';
import { useProcessing } from '../context/ProcessingContext';

export const useHeicConverter = () => {
  const [heicFile, setHeicFile] = useState(null);
  const [heicFileName, setHeicFileName] = useState('');
  const [heicError, setHeicError] = useState('');
  const [heicSuccessMessage, setHeicSuccessMessage] = useState('');
  const [compressToUnder2MB, setCompressToUnder2MB] = useState(false);

  const { processHeicWithRust, initError: wasmInitError } = useRustHeicConverter();
  const { isProcessingHeic, setIsProcessingHeic } = useProcessing();

  const handleHeicFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setHeicFile(selectedFile);
      setHeicFileName(selectedFile.name);
      setHeicError('');
      setHeicSuccessMessage('');
    }
  };

  const handleCompressToggle = (e) => {
    setCompressToUnder2MB(e.target.checked);
  };

  const handleConvertHeic = async () => {
    if (!heicFile) return;

    setIsProcessingHeic(true);
    setHeicError('');

    try {
      const imageBuffer = await createSafeBuffer(heicFile);
      const outBlob = await processHeicWithRust(imageBuffer, {
        compressToUnder2MB: compressToUnder2MB,
      });

      const baseName = heicFile.name.replace(/\.[^/.]+$/, '');
      const outputFileName = `${baseName}.png`;
      downloadBlob(outBlob, outputFileName);
      setHeicSuccessMessage(`Image converted successfully! File downloaded: ${outputFileName}`);
    } catch (err) {
      const errorMessage = err.message || 'Failed to convert HEIC to PNG';
      setHeicError(errorMessage);
      console.error('[useHeicConverter] HEIC conversion error:', err);
    } finally {
      setIsProcessingHeic(false);
    }
  };

  const handleCancelHeic = () => {
    cancelHeicConversion();
    setIsProcessingHeic(false);
    setHeicError('');
  };

  return {
    heicFile,
    heicFileName,
    isProcessingHeic,
    heicError,
    heicSuccessMessage,
    compressToUnder2MB,
    wasmInitError,
    handleHeicFileChange,
    handleCompressToggle,
    handleConvertHeic,
    handleCancelHeic,
  };
};
