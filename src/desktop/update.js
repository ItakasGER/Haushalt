// Versionsabgleich der Mac-App mit der veröffentlichten (iPad-)Version.
// GitHub Pages liefert version.json; ist die Nummer dort höher, steht ein neuer
// Mac-Download bereit. Ohne Internet passiert einfach nichts.
import { useEffect, useState } from 'react';

export const VERSION_URL = 'https://itakasger.github.io/Haushalt/version.json';
export const DOWNLOAD_URL = 'https://github.com/ItakasGER/Haushalt/releases/latest';

export function isNewer(remote, local) {
  const a = String(remote).split('.').map(n => parseInt(n, 10) || 0);
  const b = String(local).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

export function useDesktopUpdate() {
  const [latest, setLatest] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!cancelled && version && isNewer(version, __APP_VERSION__)) setLatest(version);
      } catch (e) { /* offline */ }
    };
    check();
    const timer = setInterval(check, 6 * 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);
  return latest;
}
