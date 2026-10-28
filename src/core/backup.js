// Backup/Restore aller App-Daten als JSON. Das Format ist mit der Mac-Version
// kompatibel (siehe README: Daten vom Mac übernehmen).

import { storage, PREFIX } from './storage.js';

export const BACKUP_FORMAT = 'haushalt-backup';

export function createBackup() {
  const entries = {};
  storage.keys().forEach(k => { entries[k] = storage.get(k); });
  return {
    format: BACKUP_FORMAT,
    appVersion: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

// Liest ein Backup (eigenes Format oder roher localStorage-Dump mit "findash:"-Schlüsseln)
export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('Die Datei ist kein gültiges JSON.'); }
  let entries = data && data.format === BACKUP_FORMAT ? data.entries : data;
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) throw new Error('Unbekanntes Backup-Format.');
  const normalized = {};
  Object.entries(entries).forEach(([k, v]) => {
    const key = k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k;
    normalized[key] = typeof v === 'string' ? v : JSON.stringify(v);
  });
  const hasPlans = 'plans-index' in normalized || 'haushaltsrechnung' in normalized;
  if (!hasPlans) throw new Error('Im Backup wurden keine Haushaltspläne gefunden.');
  let planCount = 1;
  try { planCount = JSON.parse(normalized['plans-index'] || '[]').length || 1; } catch (e) { planCount = 1; }
  return { entries: normalized, planCount, exportedAt: data.exportedAt || null };
}

// Ersetzt alle vorhandenen Daten durch das Backup
export function restoreBackup(entries) {
  storage.deletePrefix('');
  Object.entries(entries).forEach(([k, v]) => storage.set(k, v));
}

export async function shareOrDownload(filename, text) {
  const file = new File([text], filename, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'aborted';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
