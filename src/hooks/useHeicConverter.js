import { useState } from 'react';
import { useRustHeicConverter } from './useRustHeicConverter';
import { createSafeBuffer } from '../utils/createSafeBuffer';
import { downloadBlob } from '../utils/downloadBlob';
import { useProcessing } from '../context/ProcessingContext';
import { detectImageContainer, getUnsupportedHeicMessage } from '../utils/detectImageContainer';

export const useHeicConverter = () => {
  const [heicFile, setHeicFile] = useState(null);
  const [heicFileName, setHeicFileName] = useState('');
  const [heicError, setHeicError] = useState('');
  const [heicSuccessMessage, setHeicSuccessMessage] = useState('');
  const [compressToUnder2MB, setCompressToUnder2MB] = useState(false);

  const { processHeicWithRust } = useRustHeicConverter();
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
    setHeicSuccessMessage('');

    try {
      const imageBuffer = await createSafeBuffer(heicFile);
      const detected = detectImageContainer(imageBuffer);

      if (detected.format === 'png' || detected.format === 'jpeg') {
        throw new Error(getUnsupportedHeicMessage(heicFile.name, detected));
      }

      const outBlob = await processHeicWithRust(imageBuffer, {
        compressToUnder2MB: compressToUnder2MB,
      });

      const baseName = heicFile.name.replace(/\.[^/.]+$/, '');
      // choose extension from returned blob type when possible
      let ext = '.png';
      if (outBlob && outBlob.type) {
        if (outBlob.type.includes('webp')) ext = '.webp';
        else if (outBlob.type.includes('jpeg') || outBlob.type.includes('jpg')) ext = '.jpg';
        else if (outBlob.type.includes('png')) ext = '.png';
      }
      const outputFileName = `${baseName}${ext}`;
      downloadBlob(outBlob, outputFileName);
      setHeicSuccessMessage(`Image converted successfully! File downloaded: ${outputFileName}`);
    } catch (err) {
      const errorMessage = err.message || 'Failed to convert HEIC to PNG';
      setHeicError(errorMessage);
      console.error('[HeicConverterForm] HEIC conversion error:', err);
    } finally {
      setIsProcessingHeic(false);
    }
  };

  return {
    heicFile,
    heicFileName,
    isProcessingHeic,
    heicError,
    heicSuccessMessage,
    compressToUnder2MB,
    handleHeicFileChange,
    handleCompressToggle,
    handleConvertHeic,
  };
};
