// Zentraler Zustand: Haushaltspläne, Budget und Investments des aktiven Plans.
// Module greifen ausschließlich über usePlan() / useModuleData() darauf zu.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from './storage.js';
import { runMigrations } from './migrations.js';
import { DEFAULT_BUDGET, BLANK_BUDGET } from './defaults.js';
import { computeTotals } from './finance.js';
import { todayISO, uid } from './format.js';

const PlanContext = createContext(null);

const loadPlanData = (id) => ({
  budget: { ...DEFAULT_BUDGET, ...storage.getJSON(`plan:${id}:budget`, {}) },
  investments: storage.getJSON(`plan:${id}:investments`, []),
});

function loadState() {
  runMigrations();
  const plans = storage.getJSON('plans-index', []);
  let activePlanId = storage.get('active-plan-id');
  if (!plans.some(p => p.id === activePlanId)) activePlanId = plans[0].id;
  return { plans, activePlanId, ...loadPlanData(activePlanId) };
}

export function PlanProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [saveError, setSaveError] = useState('');
  // Wird erhöht, wenn Daten von außen ersetzt werden (z. B. Backup-Import)
  const [dataVersion, setDataVersion] = useState(0);
  const { plans, activePlanId, budget, investments } = state;

  const persist = useCallback((key, value, errorText) => {
    try {
      storage.setJSON(key, value);
      setSaveError('');
    } catch (e) {
      setSaveError(errorText);
    }
  }, []);

  const saveBudget = useCallback((next) => {
    setState(s => ({ ...s, budget: next }));
    persist(`plan:${activePlanId}:budget`, next, 'Speichern der Haushaltsrechnung fehlgeschlagen.');
  }, [activePlanId, persist]);

  const saveInvestments = useCallback((next) => {
    setState(s => ({ ...s, investments: next }));
    persist(`plan:${activePlanId}:investments`, next, 'Speichern der Investments fehlgeschlagen.');
  }, [activePlanId, persist]);

  const savePlans = (next) => {
    setState(s => ({ ...s, plans: next }));
    persist('plans-index', next, 'Speichern der Planliste fehlgeschlagen.');
  };

  const activate = (id, data) => {
    storage.set('active-plan-id', id);
    setState(s => ({ ...s, activePlanId: id, ...data }));
  };

  const actions = {
    // Budget
    saveBudget,
    updateItem: (group, id, patch) => saveBudget({ ...budget, [group]: budget[group].map(it => it.id === id ? { ...it, ...patch } : it) }),
    addItem: (group, name) => {
      if (!name || !name.trim()) return;
      saveBudget({ ...budget, [group]: [...budget[group], { id: uid(), name: name.trim(), amount: 0 }] });
    },
    removeItem: (group, id) => saveBudget({ ...budget, [group]: budget[group].filter(it => it.id !== id) }),
    takeMonthSnapshot: () => {
      const t = computeTotals(budget, investments);
      const month = todayISO().slice(0, 7);
      const entry = {
        month, einnahmen: t.einnahmenGesamt, fixkosten: t.fixkostenGesamt, flexkosten: t.flexkostenGesamt, fcf: t.fcf,
        allokation: t.allokationGesamt, nichtAllokiert: t.nichtAllokiert, sparquote: t.sparquote, fixkostenquote: t.fixkostenquote,
      };
      saveBudget({ ...budget, history: [...(budget.history || []).filter(h => h.month !== month), entry] });
      return month;
    },

    // Investments
    saveInvestments,
    addPosition: (pos) => saveInvestments([...investments, { id: uid(), ...pos }]),
    deletePosition: (id) => saveInvestments(investments.filter(p => p.id !== id)),
    updatePosition: (id, patch) => saveInvestments(investments.map(p => p.id === id ? { ...p, ...patch } : p)),

    // Pläne
    switchPlan: (id) => { if (id !== activePlanId) activate(id, loadPlanData(id)); },
    createPlan: (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      const id = uid();
      storage.setJSON(`plan:${id}:budget`, BLANK_BUDGET);
      storage.setJSON(`plan:${id}:investments`, []);
      savePlans([...plans, { id, name: trimmed, createdAt: todayISO() }]);
      activate(id, { budget: BLANK_BUDGET, investments: [] });
    },
    renamePlan: (id, name) => {
      const trimmed = (name || '').trim();
      if (trimmed) savePlans(plans.map(p => p.id === id ? { ...p, name: trimmed } : p));
    },
    deletePlan: (id) => {
      storage.deletePrefix(`plan:${id}:`);
      const remaining = plans.filter(p => p.id !== id);
      if (remaining.length === 0) {
        const newId = uid();
        storage.setJSON(`plan:${newId}:budget`, BLANK_BUDGET);
        storage.setJSON(`plan:${newId}:investments`, []);
        savePlans([{ id: newId, name: 'Mein Haushalt', createdAt: todayISO() }]);
        activate(newId, { budget: BLANK_BUDGET, investments: [] });
        return;
      }
      savePlans(remaining);
      if (id === activePlanId) activate(remaining[0].id, loadPlanData(remaining[0].id));
    },
    resetActivePlan: () => {
      storage.deletePrefix(`plan:${activePlanId}:`);
      storage.setJSON(`plan:${activePlanId}:budget`, BLANK_BUDGET);
      storage.setJSON(`plan:${activePlanId}:investments`, []);
      setState(s => ({ ...s, budget: BLANK_BUDGET, investments: [] }));
      setDataVersion(v => v + 1);
    },

    // Nach Backup-Import alles neu einlesen
    reloadFromStorage: () => {
      setState(loadState());
      setDataVersion(v => v + 1);
    },
  };

  const totals = useMemo(() => computeTotals(budget, investments), [budget, investments]);
  const activePlan = plans.find(p => p.id === activePlanId);

  const value = { plans, activePlan, activePlanId, budget, investments, totals, saveError, dataVersion, ...actions };
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan() muss innerhalb von <PlanProvider> verwendet werden');
  return ctx;
}

// Eigener, pro Haushaltsplan getrennter Speicher für ein Modul.
// Beispiel: const [notizen, setNotizen] = useModuleData('notizen', []);
// Wird automatisch mitgesichert (Backup) und beim Löschen des Plans entfernt.
export function useModuleData(moduleId, defaultValue) {
  const { activePlanId, dataVersion } = usePlan();
  const key = `plan:${activePlanId}:mod:${moduleId}`;
  const [value, setValue] = useState(() => storage.getJSON(key, defaultValue));

  useEffect(() => {
    setValue(storage.getJSON(key, defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dataVersion]);

  const save = useCallback((next) => {
    setValue(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      storage.setJSON(key, resolved);
      return resolved;
    });
  }, [key]);

  return [value, save];
}
