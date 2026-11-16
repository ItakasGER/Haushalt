// Zeigt einen Hinweis, sobald eine neue Version (Patch) online ist.
// iPad (PWA): Service Worker lädt das Update, „Jetzt aktualisieren“ startet neu.
// Mac-App: verweist auf den Download der neuen Version.
import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw } from 'lucide-react';
import { COLORS } from '../core/theme.js';
import { DOWNLOAD_URL, useDesktopUpdate } from '../desktop/update.js';
import { Button } from './components.jsx';

function Banner({ icon, text, children }) {
  return (
    <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm" style={{ backgroundColor: '#E8EBFA', borderBottom: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-2">{icon} {text}</span>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function PwaUpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Beim Öffnen und danach stündlich nach Updates schauen
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <Banner icon={<RefreshCw size={16} />} text="Eine neue Version ist verfügbar.">
      <Button variant="primary" onClick={() => updateServiceWorker(true)}>Jetzt aktualisieren</Button>
      <Button onClick={() => setNeedRefresh(false)}>Später</Button>
    </Banner>
  );
}

function DesktopUpdateBanner() {
  const latest = useDesktopUpdate();
  const [dismissed, setDismissed] = useState(false);
  if (!latest || dismissed) return null;
  return (
    <Banner icon={<Download size={16} />} text={`Version ${latest} ist verfügbar (installiert: ${__APP_VERSION__}). Deine Daten bleiben beim Update erhalten.`}>
      <Button variant="primary" onClick={() => window.open(DOWNLOAD_URL, '_blank')}>Download öffnen</Button>
      <Button onClick={() => setDismissed(true)}>Später</Button>
    </Banner>
  );
}

export default __DESKTOP__ ? DesktopUpdateBanner : PwaUpdateBanner;
