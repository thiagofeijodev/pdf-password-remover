import * as styles from '../App.module.css';
import { useRustPDFRemover } from '../hooks/useRustPDFRemover';
import { usePDFPasswordRemover } from '../hooks/usePDFPasswordRemover';

const PDFRemoverForm = () => {
  const { processPDFWithRust } = useRustPDFRemover();
  const {
    file,
    password,
    isProcessing,
    error,
    fileName,
    savePassword,
    handleFileChange,
    handlePasswordChange,
    handleSavePasswordChange,
    handleRemovePassword,
  } = usePDFPasswordRemover(processPDFWithRust);

  return (
    <div className={styles.form}>
      <p className={styles.subtitle}>
        Upload a password-protected PDF and remove its password protection
      </p>

      <div className={styles.inputGroup}>
        <label htmlFor="pdf-input" className={styles.label}>
          Select PDF File
        </label>
        <input
          id="pdf-input"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className={styles.fileInput}
          disabled={isProcessing}
        />
        {fileName && (
          <div className={styles.fileName}>
            <span>Selected: {fileName}</span>
          </div>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password-input" className={styles.label}>
          PDF Password
        </label>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter the PDF password"
          className={styles.passwordInput}
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRemovePassword();
            }
          }}
        />
        <div className={styles.checkboxGroup}>
          <input
            id="save-password-checkbox"
            type="checkbox"
            checked={savePassword}
            onChange={handleSavePasswordChange}
            className={styles.checkbox}
            disabled={isProcessing}
          />
          <label htmlFor="save-password-checkbox" className={styles.checkboxLabel}>
            Save password for next time
          </label>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        onClick={handleRemovePassword}
        disabled={isProcessing || !file || !password}
        className={styles.button}
      >
        {isProcessing ? 'Processing...' : 'Remove Password & Download'}
      </button>
    </div>
  );
};

export default PDFRemoverForm;
