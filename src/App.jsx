import { useEffect } from 'react';
import * as styles from './App.module.css';
import { usePDFPasswordRemover } from './hooks/usePDFPasswordRemover';
import { createGoogleTag } from './utils/createGoogleTag';
import { usePdfiumPDFRemover } from './hooks/usePdfiumPDFRemover';
import LogoPng from '../public/logo.png';

const App = () => {
  const { processPDFWithPdfium } = usePdfiumPDFRemover();
  const {
    password,
    isProcessing,
    error,
    fileName,
    file,
    savePassword,
    handleFileChange,
    handlePasswordChange,
    handleSavePasswordChange,
    handleRemovePassword,
  } = usePDFPasswordRemover(processPDFWithPdfium);

  useEffect(() => {
    createGoogleTag();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src={LogoPng} alt="PDF Password Remover Logo" className={styles.logo} />
        <h1 className={styles.title}>PDF Password Remover</h1>
        <p className={styles.subtitle}>
          Upload a password-protected PDF and remove its password protection
        </p>

        <div className={styles.form}>
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

        <div className={styles.info}>
          <p>🔒 All processing is done in your browser</p>
          <p>📁 Your files never leave your device</p>
          <p>⚙️ Built with WebAssembly & PDFium</p>
        </div>
      </div>
      <footer className={styles.footer}>
        developed by{' '}
        <a href="https://feijo.dev" target="_blank" rel="noopener noreferrer">
          feijo.dev
        </a>
      </footer>
    </div>
  );
};

export default App;
