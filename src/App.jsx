import { useEffect, useState } from 'react';
import * as styles from './App.module.css';
import { createGoogleTag } from './utils/createGoogleTag';
import LogoPng from '../public/logo.png';

import { ProcessingProvider } from './context/ProcessingProvider';
import PDFRemoverForm from './components/PDFRemoverForm';
import HeicConverterForm from './components/HeicConverterForm';
import InfoFooter from './components/InfoFooter';
import LoadingSpinner from './components/LoadingSpinner';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('pdf');

  useEffect(() => {
    createGoogleTag();
  }, []);

  return (
    <div className={styles.container}>
      <a
        href="https://github.com/thiagofeijodev/pdf-password-remover"
        className={styles.forkLink}
        target="_blank"
        rel="noopener noreferrer"
        title="Fork on GitHub"
      >
        <div className={styles.forkLabelWrapper}>
          <span>Fork</span>
          <span>on GitHub</span>
        </div>
      </a>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.logoButton}
          onClick={() => setActiveTab((prev) => (prev === 'pdf' ? 'heic' : 'pdf'))}
          aria-label="Toggle hidden tool mode"
          title="Hidden mode switch"
        >
          <img src={LogoPng} alt="PDF Password Remover Logo" className={styles.logo} />
        </button>

        <h1 className={styles.title}>
          {activeTab === 'pdf' ? <>PDF Password Remover</> : <>HEIC to PNG</>}
        </h1>

        {activeTab === 'pdf' && <PDFRemoverForm />}

        {activeTab === 'heic' && <HeicConverterForm />}

        <LoadingSpinner />
        <InfoFooter />
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

const App = () => (
  <ProcessingProvider>
    <AppContent />
  </ProcessingProvider>
);

export default App;
