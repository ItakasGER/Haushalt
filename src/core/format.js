export const fmtEUR = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);
export const fmtEURDetailed = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
export const fmtPct = (n) => `${((Number(n) || 0) * 100).toFixed(1).replace('.', ',')} %`;
export const fmtNumber = (n) => (n === '' || n === null || n === undefined) ? '' : String(n).replace('.', ',');
// Akzeptiert deutsche Eingaben ("1.234,56") und englische ("1234.56")
export const parseNumber = (text) => {
  let s = String(text ?? '').trim().replace(/\s|€|%/g, '');
  if (s === '') return '';
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : '';
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
};
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
