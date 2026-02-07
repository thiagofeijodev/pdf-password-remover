import { useState, useEffect } from 'react';
import * as styles from '../App.module.css';
import workerClient from '../utils/workerWasmClient';

const InfoFooter = () => {
  const [useWorker, setUseWorkerState] = useState(true);

  useEffect(() => {
    setUseWorkerState(workerClient.getUseWorker());
  }, []);

  const handleUseWorkerChange = (e) => {
    const checked = e.target.checked;
    workerClient.setUseWorker(checked);
    setUseWorkerState(checked);
  };

  return (
    <div className={styles.info}>
      <p>🔒 All processing is done in your browser</p>
      <p>📁 Your files never leave your device</p>
      <p>
        ⚙️ Built with WebAssembly & Rust &{' '}
        <a href="https://docs.rs/lopdf/latest/lopdf/" target="_blank" rel="noopener noreferrer">
          lopdf
        </a>
      </p>
      {typeof Worker !== 'undefined' && (
        <p className={styles.workerToggleRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={useWorker}
              onChange={handleUseWorkerChange}
              title="Keeps the UI responsive during processing; uses more memory"
            />
            Use background worker for processing
          </label>
        </p>
      )}
    </div>
  );
};

export default InfoFooter;
