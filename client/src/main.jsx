import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initApi } from './lib/api.js';
import { initPlayer } from './lib/player.js';
import './styles.css';

initPlayer();
initApi();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
