// Wiederverwendbare, touch-optimierte Bausteine (Tippflächen ≥ 44 pt, 16-px-
// Schrift in Eingabefeldern, damit iPadOS beim Fokussieren nicht zoomt).

import React, { useEffect, useState } from 'react';
import { COLORS } from '../core/theme.js';
import { fmtNumber, parseNumber } from '../core/format.js';

export function Card({ title, right, className = '', children }) {
  return (
    <div className={`rounded-xl p-4 ${className}`} style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          {title && <div className="text-xs font-semibold tracking-wide" style={{ color: COLORS.textMuted }}>{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function SummaryCard({ icon, label, value, sub, subColor, valueColor }) {
  return (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.textMuted }}>{icon}{label}</div>
      <div className="text-xl font-semibold tabular-nums" style={{ color: valueColor || COLORS.textDark }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: subColor || COLORS.textMuted }}>{sub || ' '}</div>
    </div>
  );
}

export function KPI({ label, value, color }) {
  return (
    <div>
      <div className="text-xs" style={{ color: COLORS.textMuted }}>{label}</div>
      <div className="text-base font-semibold tabular-nums" style={{ color: color || COLORS.textDark }}>{value}</div>
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="text-sm py-8 text-center" style={{ color: COLORS.textMuted }}>{text}</div>;
}

export function Dot({ color, size = 8 }) {
  return <span className="rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color, width: size, height: size }} />;
}

const inputStyle = { borderColor: COLORS.border, fontSize: 16 };

// Zahlenfeld mit deutscher Eingabe (Komma) und Ziffernblock-Tastatur.
// Speichert erst beim Verlassen des Feldes oder mit "Return" (onCommit).
export function NumberField({ value, onCommit, className = 'w-28', suffix, step, ...rest }) {
  const [draft, setDraft] = useState(fmtNumber(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setDraft(fmtNumber(value)); }, [value, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = parseNumber(draft);
    if (parsed !== (value === '' || value === undefined || value === null ? '' : Number(value))) onCommit(parsed);
    setDraft(fmtNumber(parsed));
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" value={draft}
        onFocus={e => { setFocused(true); e.target.select(); }}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className={`h-10 px-2 text-right rounded-lg border tabular-nums ${className}`} style={inputStyle} {...rest} />
      {suffix && <span className="text-sm" style={{ color: COLORS.textMuted }}>{suffix}</span>}
    </span>
  );
}

export function TextField({ className = 'w-full', ...rest }) {
  return <input type="text" className={`h-11 px-3 rounded-lg border ${className}`} style={inputStyle} {...rest} />;
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`h-11 px-2 rounded-lg border bg-white ${className}`} style={{ ...inputStyle, color: COLORS.textDark }} {...rest}>
      {children}
    </select>
  );
}

const VARIANTS = {
  primary: { backgroundColor: COLORS.primary, color: '#fff', border: `1px solid ${COLORS.primary}` },
  secondary: { backgroundColor: COLORS.surface, color: COLORS.textDark, border: `1px solid ${COLORS.border}` },
  danger: { backgroundColor: COLORS.expense, color: '#fff', border: `1px solid ${COLORS.expense}` },
  ghost: { backgroundColor: 'transparent', color: COLORS.textMuted, border: '1px solid transparent' },
};

export function Button({ variant = 'secondary', className = '', children, ...rest }) {
  return (
    <button className={`min-h-[44px] px-4 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 active:opacity-70 disabled:opacity-40 ${className}`}
      style={VARIANTS[variant]} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button aria-label={label} title={label} className={`w-11 h-11 inline-flex items-center justify-center rounded-lg active:bg-black/5 flex-shrink-0 ${className}`}
      style={{ color: COLORS.textMuted }} {...rest}>
      {children}
    </button>
  );
}

// Bestätigungsleiste für unumkehrbare Aktionen
export function ConfirmBar({ text, confirmLabel = 'Löschen', onConfirm, onCancel }) {
  return (
    <div className="px-4 py-3 flex flex-wrap items-center justify-between text-sm gap-3" style={{ backgroundColor: '#FFF3CD', borderBottom: `1px solid ${COLORS.border}` }}>
      <span>{text}</span>
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        <Button onClick={onCancel}>Abbrechen</Button>
      </div>
    </div>
  );
}
