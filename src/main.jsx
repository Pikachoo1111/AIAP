// main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // Import App component
import './index.css';      // Global CSS
import './App.css';        // App-specific CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
