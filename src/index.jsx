import { createRoot } from 'react-dom/client';
import App from './App';

// Render the React application
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// Register service worker
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
