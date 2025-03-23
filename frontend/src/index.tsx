import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';


// Get root element and create React root
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

// Render the application
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
); 