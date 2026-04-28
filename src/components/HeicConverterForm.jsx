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
    wasmInitError,
    handleHeicFileChange,
    handleCompressToggle,
    handleConvertHeic,
    handleCancelHeic,
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
            onChange={handleCompressToggle}
            disabled={isProcessingHeic}
          />{' '}
          Resize and compress
        </label>
      </div>
      {heicSuccessMessage && <div className={styles.success}>{heicSuccessMessage}</div>}

      {wasmInitError && <div className={styles.error}>{wasmInitError}</div>}
      {heicError && <div className={styles.error}>{heicError}</div>}

      {isProcessingHeic ? (
        <button type="button" onClick={handleCancelHeic} className={styles.button}>
          Cancel
        </button>
      ) : (
        <button onClick={handleConvertHeic} disabled={!heicFile} className={styles.button}>
          Convert to PNG & Download
        </button>
      )}
    </div>
  );
};

export default HeicConverterForm;
