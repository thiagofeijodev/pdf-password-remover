import { useState } from 'react';
import * as styles from '../App.module.css';
import { useRustHeicConverter } from '../hooks/useRustHeicConverter';
import { createPDFBuffer } from '../utils/createPDFBuffer';
import { downloadBlob } from '../utils/downloadBlob';

const HeicConverterForm = () => {
  const [heicFile, setHeicFile] = useState(null);
  const [heicFileName, setHeicFileName] = useState('');
  const [isProcessingHeic, setIsProcessingHeic] = useState(false);
  const [heicError, setHeicError] = useState('');

  const { processHeicWithRust } = useRustHeicConverter();

  const handleHeicFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setHeicFile(selectedFile);
      setHeicFileName(selectedFile.name);
      setHeicError('');
    }
  };

  const handleConvertHeic = async () => {
    if (!heicFile) return;

    setIsProcessingHeic(true);
    setHeicError('');

    try {
      const imageBuffer = await createPDFBuffer(heicFile);
      const pngBlob = await processHeicWithRust(imageBuffer);
      const baseName = heicFile.name.replace(/\.[^/.]+$/, '');
      downloadBlob(pngBlob, `${baseName}.png`);
    } catch (err) {
      const errorMessage = err.message || 'Failed to convert HEIC to PNG';
      setHeicError(errorMessage);
      console.error('[HeicConverterForm] HEIC conversion error:', err);
    } finally {
      setIsProcessingHeic(false);
    }
  };

  return (
    <div className={styles.form}>
      <p className={styles.subtitle}>Convert your HEIC images to PNG format</p>

      <div className={styles.inputGroup}>
        <label htmlFor="heic-input" className={styles.label}>
          Select HEIC Image
        </label>
        <input
          id="heic-input"
          type="file"
          accept=".heic,.heif,image/heic,image/heif"
          onChange={handleHeicFileChange}
          className={styles.fileInput}
          disabled={isProcessingHeic}
        />
        {heicFileName && (
          <div className={styles.fileName}>
            <span>Selected: {heicFileName}</span>
          </div>
        )}
      </div>

      {heicError && <div className={styles.error}>{heicError}</div>}

      <button
        onClick={handleConvertHeic}
        disabled={isProcessingHeic || !heicFile}
        className={styles.button}
      >
        {isProcessingHeic ? 'Converting...' : 'Convert to PNG & Download'}
      </button>
    </div>
  );
};

export default HeicConverterForm;
