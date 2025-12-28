import { createRoot } from 'react-dom/client';
import App from './App';

// Render the React application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// Register service worker only in production.
// In development, proactively unregister existing SWs to avoid stale caches
// (e.g., after previously serving the production build on the same origin).
if ('serviceWorker' in navigator) {
  const isProduction = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';

  if (isProduction) {
    navigator.serviceWorker.register('service-worker.js');
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((reg) => reg.unregister())))
      .catch(() => {
        // Ignore SW cleanup failures in dev.
      });

    if ('caches' in window) {
      window.caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
        .catch(() => {
          // Ignore cache cleanup failures in dev.
        });
    }
  }
}
