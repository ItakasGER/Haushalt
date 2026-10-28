// Lokaler Speicher auf dem Gerät (localStorage). Schlüssel und Format sind
// identisch zur Mac-Version (Präfix "findash:"), damit Backups zwischen
// Mac und iPad austauschbar sind.

export const PREFIX = 'findash:';

export const storage = {
  get(key) {
    return window.localStorage.getItem(PREFIX + key);
  },
  getJSON(key, fallback) {
    const raw = storage.get(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  },
  set(key, value) {
    window.localStorage.setItem(PREFIX + key, value);
  },
  setJSON(key, value) {
    storage.set(key, JSON.stringify(value));
  },
  delete(key) {
    window.localStorage.removeItem(PREFIX + key);
  },
  keys(prefix = '') {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
    }
    return keys;
  },
  deletePrefix(prefix) {
    storage.keys(prefix).forEach(k => storage.delete(k));
  },
};

// Bittet iPadOS, die Daten nicht automatisch zu löschen (bei installierter
// Home-Bildschirm-App ohnehin der Fall). Gibt true/false/null (unbekannt) zurück.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch (e) { return null; }
}
