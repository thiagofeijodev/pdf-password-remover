import * as styles from '../App.module.css';
import { useHeicConverter } from '../hooks/useHeicConverter';

const HeicConverterForm = () => {
  const {
    heicFile,
    heicFileName,
    isProcessingHeic,
    heicError,
    heicSuccessMessage,
    compressToUnder2MB,
    handleHeicFileChange,
    handleCompressToggle,
    handleConvertHeic,
  } = useHeicConverter();

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
          disabled={isHeicProcessing}
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
            onChange={handleCompressToggle}
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
        disabled={isHeicProcessing || !heicFile}
        className={styles.button}
      >
        {isHeicProcessing ? 'Converting...' : 'Convert to PNG & Download'}
      </button>
    </div>
  );
};

export default HeicConverterForm;
