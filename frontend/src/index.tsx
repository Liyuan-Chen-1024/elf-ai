import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { initDebug } from './utils/debug';

// Initialize debugging tools
if (import.meta.env.DEV) {
  initDebug();
}

// Get root element and create React root
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

const root = createRoot(rootElement);

// Render the application
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
