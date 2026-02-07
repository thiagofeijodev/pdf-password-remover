import { useEffect, useState } from 'react';
import * as styles from './App.module.css';
import { createGoogleTag } from './utils/createGoogleTag';
import LogoPng from '../public/logo.png';

import { ProcessingProvider } from './context/processingContext';
import TabNav from './components/TabNav';
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
        <img src={LogoPng} alt="File Converter Logo" className={styles.logo} />
        <h1 className={styles.title}>File Converter</h1>

        <TabNav activeTab={activeTab} onChange={setActiveTab} />

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
