// Depot-Auswertung ohne UI: Gewinn/Verlust, Monatsstände, zeitgewichtete Rendite.

import { monthLabel, todayISO } from './format.js';

const hasInvested = (p) => p.invested !== '' && p.invested !== null && p.invested !== undefined && Number(p.invested) > 0;

// Gewinn/Verlust einer Position; null, solange kein Einstandswert erfasst ist
export function positionPL(p) {
  if (!hasInvested(p)) return null;
  const value = Number(p.value) || 0;
  const invested = Number(p.invested);
  return { value, invested, pl: value - invested, plPct: (value - invested) / invested };
}

// Summen über das Depot. G/V bezieht sich nur auf Positionen mit Einstandswert.
export function portfolioPL(investments) {
  const total = investments.reduce((a, p) => a + (Number(p.value) || 0), 0);
  const covered = investments.filter(hasInvested);
  const invested = covered.reduce((a, p) => a + Number(p.invested), 0);
  const coveredValue = covered.reduce((a, p) => a + (Number(p.value) || 0), 0);
  const pl = coveredValue - invested;
  return {
    total, invested, pl, plPct: invested > 0 ? pl / invested : null,
    coveredCount: covered.length, complete: investments.length > 0 && covered.length === investments.length,
  };
}

export function buildDepotSnapshot(investments, month) {
  const { total, invested, complete } = portfolioPL(investments);
  return {
    month, savedAt: todayISO(), total,
    // Einstand nur, wenn er für alle Titel bekannt ist – sonst wäre die Rendite verfälscht
    invested: complete ? invested : null,
    positions: investments.map(p => ({ id: p.id, name: p.name, category: p.category || 'Sonstiges', value: Number(p.value) || 0, invested: hasInvested(p) ? Number(p.invested) : null })),
  };
}

const monthsBetween = (a, b) => {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
};

// Zeitreihe aus den Monatsständen. Rendite je Periode nach Modified Dietz:
//   r = (Endwert − Anfangswert − Zufluss) / (Anfangswert + ½ · Zufluss)
// Zufluss = Veränderung des Einstandswerts (Käufe minus Einstand verkaufter Titel).
// Verkettet ergibt das die zeitgewichtete Rendite (TWR) – unabhängig von der Höhe der Einzahlungen.
export function performanceSeries(history) {
  const sorted = [...(history || [])].sort((a, b) => a.month.localeCompare(b.month));
  let cum = 1;
  let chained = 0;
  const rows = sorted.map((h, i) => {
    const prev = sorted[i - 1];
    const known = h.invested !== null && h.invested !== undefined;
    const row = {
      month: h.month, label: monthLabel(h.month), total: h.total, invested: known ? h.invested : null,
      pl: known ? h.total - h.invested : null, manual: !!h.manual, flow: null, ret: null, cum: null,
    };
    if (prev && known && prev.invested !== null && prev.invested !== undefined) {
      row.flow = h.invested - prev.invested;
      const base = prev.total + 0.5 * row.flow;
      if (base > 0) {
        row.ret = (h.total - prev.total - row.flow) / base;
        cum *= 1 + row.ret;
        chained += 1;
      }
    }
    row.cum = chained > 0 ? cum - 1 : (i === 0 ? 0 : null);
    return row;
  });

  const first = rows[0];
  const last = rows[rows.length - 1];
  const months = rows.length > 1 ? monthsBetween(first.month, last.month) : 0;
  const twr = chained > 0 ? cum - 1 : null;
  return {
    rows, months, twr,
    // Annualisierung erst ab 12 Monaten sinnvoll
    twrPa: twr !== null && months >= 12 ? Math.pow(1 + twr, 12 / months) - 1 : null,
    since: first ? first.label : null,
  };
}
