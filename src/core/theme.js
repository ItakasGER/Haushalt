export const COLORS = {
  primary: '#0018A8',
  primaryLight: '#3D52C7',
  bg: '#F4F5FA',
  surface: '#FFFFFF',
  border: '#DDE0EB',
  textDark: '#12142B',
  textMuted: '#6B7086',
  income: '#0F9D58',
  expense: '#D93025',
  warn: '#F59E0B',
};

export const STRUKTUR_COLORS = {
  'Fixkosten': '#D93025',
  'Flexkosten': '#F59E0B',
  'Altersvorsorge': '#C9A227',
  'Sparen': '#00B4A6',
  'Investieren': '#0018A8',
  'Nicht allokiert': '#9AA0B4',
};

export const CATEGORY_COLORS_DEFAULT = {
  'Aktie': '#0018A8',
  'ETF': '#00B4A6',
  'Anleihe': '#C9A227',
  'Rohstoff/Krypto': '#8B5CF6',
  'Sonstiges': '#6B7086',
};
export const DEFAULT_INVESTMENT_CATEGORIES = ['Aktie', 'ETF', 'Anleihe', 'Rohstoff/Krypto', 'Sonstiges'];
const EXTRA_COLORS = ['#EC4899', '#06B6D4', '#84CC16', '#EF4444', '#F59E0B'];

export const getCategoryColor = (cat, uniqueCats) => {
  if (CATEGORY_COLORS_DEFAULT[cat]) return CATEGORY_COLORS_DEFAULT[cat];
  const idx = uniqueCats.indexOf(cat);
  return EXTRA_COLORS[idx >= 0 ? idx % EXTRA_COLORS.length : 0];
};
