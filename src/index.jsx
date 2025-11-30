import { createRoot } from 'react-dom/client';
import * as pdfjsLib from 'pdfjs-dist';
import App from './App';

// Render the React application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// Set up PDF.js worker
// Use the actual installed version from pdfjsLib.version
if (typeof window !== 'undefined') {
  // PDF.js 4.x uses .mjs files - use jsdelivr CDN which is reliable
  const pdfjsVersion = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

// Register service worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
