// Datenmigrationen. Wenn sich das Speicherformat ändert, hier einen neuen
// Eintrag mit der nächsthöheren Version anhängen – bestehende Einträge nie ändern.
// Jede Migration läuft genau einmal pro Gerät (Stand in "schema-version").

import { storage } from './storage.js';
import { DEFAULT_BUDGET } from './defaults.js';
import { todayISO, uid } from './format.js';

const MIGRATIONS = [
  {
    version: 1,
    description: 'Einzelplan der Vorversion in "Mein Haushalt" überführen',
    run() {
      const plans = storage.getJSON('plans-index', []);
      if (plans.length > 0) return;
      const legacyBudget = storage.getJSON('haushaltsrechnung', null);
      const legacyInvestments = storage.getJSON('investments', null);
      const id = uid();
      storage.setJSON(`plan:${id}:budget`, legacyBudget ? { ...DEFAULT_BUDGET, ...legacyBudget } : DEFAULT_BUDGET);
      storage.setJSON(`plan:${id}:investments`, legacyInvestments || []);
      storage.setJSON('plans-index', [{ id, name: 'Mein Haushalt', createdAt: todayISO() }]);
      storage.set('active-plan-id', id);
      storage.delete('haushaltsrechnung');
      storage.delete('investments');
    },
  },
  // { version: 2, description: '…', run() { … } },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export function runMigrations() {
  const current = Number(storage.get('schema-version')) || 0;
  MIGRATIONS.filter(m => m.version > current).forEach(m => {
    m.run();
    storage.set('schema-version', String(m.version));
  });
}
