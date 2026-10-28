// Zeigt einen Hinweis, sobald eine neue Version (Patch) online ist.
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { COLORS } from '../core/theme.js';
import { Button } from './components.jsx';

export default function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Beim Öffnen und danach stündlich nach Updates schauen
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm" style={{ backgroundColor: '#E8EBFA', borderBottom: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-2"><RefreshCw size={16} /> Eine neue Version ist verfügbar.</span>
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => updateServiceWorker(true)}>Jetzt aktualisieren</Button>
        <Button onClick={() => setNeedRefresh(false)}>Später</Button>
      </div>
    </div>
  );
}
