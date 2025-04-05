import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/app';
import './index.css';

// Initialize the application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);