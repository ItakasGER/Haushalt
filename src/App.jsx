// App-Gerüst: Kopfzeile, Planauswahl, Kennzahlen und Navigation.
// Die eigentlichen Bereiche kommen aus src/modules/ (siehe PATCHING.md).

import React, { useState } from 'react';
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { COLORS } from './core/theme.js';
import { fmtEUR, fmtPct } from './core/format.js';
import { usePlan } from './core/PlanContext.jsx';
import { modules } from './core/registry.js';
import { storage } from './core/storage.js';
import PlanSwitcher from './ui/PlanSwitcher.jsx';
import UpdateBanner from './ui/UpdateBanner.jsx';
import { ConfirmBar, SummaryCard } from './ui/components.jsx';

function SummaryCards() {
  const { investments, totals: t } = usePlan();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
      <SummaryCard icon={<Wallet size={16} />} label="Portfolio-Wert" value={fmtEUR(t.totalPortfolio)} sub={`${investments.length} Titel`} />
      <SummaryCard icon={t.fcf >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} label="Free Cash Flow"
        value={fmtEUR(t.fcf)} sub={t.einnahmenGesamt > 0 ? `${fmtPct(t.fcf / t.einnahmenGesamt)} der Einnahmen` : '–'}
        valueColor={t.fcf >= 0 ? COLORS.income : COLORS.expense} />
      <SummaryCard icon={<PiggyBank size={16} />} label="Sparquote" value={fmtPct(t.sparquote)}
        sub={t.sparquote >= 0.2 ? 'über Zielmarke (20 %)' : 'unter Zielmarke (20 %)'} subColor={t.sparquote >= 0.2 ? COLORS.income : COLORS.warn} />
      <SummaryCard icon={<TrendingDown size={16} />} label="Fixkostenquote" value={fmtPct(t.fixkostenquote)}
        sub={t.fixkostenquote <= 0.5 ? 'im Zielbereich (< 50 %)' : 'über Zielmarke (50 %)'} subColor={t.fixkostenquote <= 0.5 ? COLORS.income : COLORS.expense} />
    </div>
  );
}

function NavButton({ module, active, onClick, compact }) {
  const Icon = module.icon;
  const color = active ? COLORS.primary : COLORS.textMuted;
  if (compact) {
    return (
      <button onClick={onClick} className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[50px]" style={{ color }}>
        {Icon && <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />}
        <span className="text-[11px] font-medium truncate max-w-full">{module.label}</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 min-h-[48px] rounded-lg text-[15px] font-medium text-left"
      style={{ color, backgroundColor: active ? '#E8EBFA' : 'transparent' }}>
      {Icon && <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />}
      {module.label}
    </button>
  );
}

export default function App() {
  const { activePlan, saveError, resetActivePlan } = usePlan();
  const [activeId, setActiveId] = useState(() => {
    const saved = storage.get('ui:active-module');
    return modules.some(m => m.id === saved) ? saved : modules[0]?.id;
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const active = modules.find(m => m.id === activeId) || modules[0];

  const select = (id) => {
    setActiveId(id);
    try { storage.set('ui:active-module', id); } catch (e) {}
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bg, color: COLORS.textDark }}>
      <header className="safe-top safe-x text-white" style={{ backgroundColor: COLORS.primary }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide">HAUSHALTSRECHNUNG & INVESTMENTS</div>
            <div className="text-xs opacity-75">Persönliche Finanzplanung</div>
          </div>
          <button onClick={() => setShowResetConfirm(true)} className="min-h-[44px] px-2 text-xs text-white/75 underline">Plan zurücksetzen</button>
        </div>
      </header>

      <div className="safe-x">
        <UpdateBanner />
        <PlanSwitcher />
        {saveError && <div className="px-4 py-2 text-sm text-white" style={{ backgroundColor: COLORS.expense }}>{saveError}</div>}
        {showResetConfirm && (
          <ConfirmBar text={`Wirklich alle Daten im Plan „${activePlan?.name}" löschen? Das kann nicht rückgängig gemacht werden.`}
            onConfirm={() => { resetActivePlan(); setShowResetConfirm(false); }} onCancel={() => setShowResetConfirm(false)} />
        )}
      </div>

      <div className="flex-1 flex safe-x">
        {/* Seitenleiste im Querformat (iPad quer / großes iPad) */}
        <nav className="hidden lg:block w-56 flex-shrink-0 p-3 border-r" style={{ borderColor: COLORS.border }}>
          <div className="sticky top-3 space-y-1">
            {modules.map(m => <NavButton key={m.id} module={m} active={m.id === active?.id} onClick={() => select(m.id)} />)}
            <div className="pt-4 px-3 text-[11px]" style={{ color: COLORS.textMuted }}>Version {__APP_VERSION__}</div>
          </div>
        </nav>

        <main className="flex-1 min-w-0 p-3 pb-28 lg:pb-6">
          {active?.showSummary !== false && <SummaryCards />}
          {active && <active.Component key={active.id} />}
        </main>
      </div>

      {/* Tab-Leiste unten im Hochformat */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 border-t safe-bottom safe-x z-20" style={{ backgroundColor: 'rgba(255,255,255,0.96)', borderColor: COLORS.border, backdropFilter: 'blur(12px)' }}>
        <div className="flex">
          {modules.map(m => <NavButton key={m.id} compact module={m} active={m.id === active?.id} onClick={() => select(m.id)} />)}
        </div>
      </nav>
    </div>
  );
}
