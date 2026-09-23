
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installSafeJsonGlobal } from './utils/safeJson';

// Initialize global protection against circular JSON errors from DOM elements / React fibers
installSafeJsonGlobal();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
