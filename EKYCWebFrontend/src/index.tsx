import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

/**
 * PUBLIC_INTERFACE
 * React entrypoint for EKYCWebFrontend.
 * Renders App which contains routing and pages.
 */
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
