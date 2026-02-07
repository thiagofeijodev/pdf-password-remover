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
  const [heicSuccessMessage, setHeicSuccessMessage] = useState('');
  const [compressToUnder2MB, setCompressToUnder2MB] = useState(false);

  const { processHeicWithRust } = useRustHeicConverter();

  const handleHeicFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setHeicFile(selectedFile);
      setHeicFileName(selectedFile.name);
      setHeicError('');
      setHeicSuccessMessage('');
    }
  };

  const handleConvertHeic = async () => {
    if (!heicFile) return;

    setIsProcessingHeic(true);
    setHeicError('');
    setHeicSuccessMessage('');

    try {
      const imageBuffer = await createPDFBuffer(heicFile);
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

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={compressToUnder2MB}
            onChange={(e) => setCompressToUnder2MB(e.target.checked)}
            disabled={isProcessingHeic}
          />{' '}
          Resize and compress to be smaller than 2MB
        </label>

        <div style={{ marginTop: 8 }}>
          Output will be PNG. The Rust converter will resize as needed to meet the size limit.
        </div>
      </div>
      {heicSuccessMessage && <div className={styles.success}>{heicSuccessMessage}</div>}

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
