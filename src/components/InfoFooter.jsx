import * as styles from '../App.module.css';

const InfoFooter = () => (
  <div className={styles.info}>
    <p>🔒 All processing is done in your browser</p>
    <p>📁 Your files never leave your device</p>
    <p>
      ⚙️ Built with WebAssembly & Rust &{' '}
      <a href="https://docs.rs/lopdf/latest/lopdf/" target="_blank" rel="noopener noreferrer">
        lopdf
      </a>
    </p>
  </div>
);

export default InfoFooter;
