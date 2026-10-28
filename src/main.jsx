import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { PlanProvider } from './core/PlanContext.jsx';
import { requestPersistentStorage } from './core/storage.js';
import './index.css';

requestPersistentStorage();

// Offene Eingaben speichern, wenn die App in den Hintergrund geht
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && document.activeElement instanceof HTMLElement) document.activeElement.blur();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlanProvider>
      <App />
    </PlanProvider>
  </React.StrictMode>,
);
