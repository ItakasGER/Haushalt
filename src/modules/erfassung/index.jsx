import React, { useState } from 'react';
import { ClipboardList, Plus, Save, Trash2 } from 'lucide-react';
import { COLORS, STRUKTUR_COLORS } from '../../core/theme.js';
import { fmtEUR, fmtPct, monthLabel } from '../../core/format.js';
import { usePlan } from '../../core/PlanContext.jsx';
import { Button, Card, Dot, IconButton, KPI, NumberField, TextField } from '../../ui/components.jsx';

function BudgetGroupEditor({ title, color, group, total, pctBase }) {
  const { budget, updateItem, addItem, removeItem } = usePlan();
  const [newName, setNewName] = useState('');
  const add = () => { addItem(group, newName); setNewName(''); };

  return (
    <Card title={<span className="flex items-center gap-1.5"><Dot color={color} />{title.toUpperCase()}</span>}
      right={<div className="text-sm font-semibold tabular-nums" style={{ color }}>{fmtEUR(total)}{pctBase ? ` · ${fmtPct(total / pctBase)}` : ''}</div>}>
      {budget[group].map(it => (
        <div key={it.id} className="flex items-center gap-2 py-0.5">
          <span className="text-[15px] flex-1 truncate">{it.name}</span>
          <NumberField value={it.amount ?? ''} onCommit={v => updateItem(group, it.id, { amount: v })} aria-label={`Betrag ${it.name}`} />
          <IconButton label={`${it.name} entfernen`} onClick={() => removeItem(group, it.id)}><Trash2 size={16} /></IconButton>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <TextField value={newName} onChange={e => setNewName(e.target.value)} placeholder="Position hinzufügen"
          enterKeyHint="done" onKeyDown={e => { if (e.key === 'Enter') add(); }} className="flex-1 min-w-0" />
        <Button variant="primary" onClick={add} aria-label="Position hinzufügen" className="!px-3"><Plus size={18} /></Button>
      </div>
    </Card>
  );
}

function Erfassung() {
  const { totals: t, takeMonthSnapshot } = usePlan();
  const [savedMonth, setSavedMonth] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <BudgetGroupEditor title="Einnahmen" color={COLORS.primary} group="einnahmen" total={t.einnahmenGesamt} />
      <BudgetGroupEditor title="Fixkosten" color={STRUKTUR_COLORS['Fixkosten']} group="fixkosten" total={t.fixkostenGesamt} pctBase={t.einnahmenGesamt} />
      <BudgetGroupEditor title="Flexkosten" color={STRUKTUR_COLORS['Flexkosten']} group="flexkosten" total={t.flexkostenGesamt} pctBase={t.einnahmenGesamt} />
      <BudgetGroupEditor title="Altersvorsorge" color={STRUKTUR_COLORS['Altersvorsorge']} group="altersvorsorge" total={t.altersvorsorgeGesamt} pctBase={t.fcf} />
      <BudgetGroupEditor title="Sparen" color={STRUKTUR_COLORS['Sparen']} group="sparen" total={t.sparenGesamt} pctBase={t.fcf} />
      <BudgetGroupEditor title="Investieren" color={STRUKTUR_COLORS['Investieren']} group="investieren" total={t.investierenGesamt} pctBase={t.fcf} />

      <Card className="md:col-span-2 xl:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6">
            <KPI label="Allokation gesamt" value={fmtEUR(t.allokationGesamt)} />
            <KPI label="Nicht allokiert (Puffer)" value={fmtEUR(t.nichtAllokiert)}
              color={t.nichtAllokiert < 0 ? COLORS.expense : (t.fcf > 0 && t.nichtAllokiert / t.fcf < 0.05 ? COLORS.warn : COLORS.income)} />
            <KPI label="Sparquote" value={fmtPct(t.sparquote)} />
            <KPI label="Fixkostenquote" value={fmtPct(t.fixkostenquote)} />
          </div>
          <div className="flex items-center gap-3">
            {savedMonth && <span className="text-sm" style={{ color: COLORS.income }}>{monthLabel(savedMonth)} gespeichert ✓</span>}
            <Button variant="primary" onClick={() => setSavedMonth(takeMonthSnapshot())}><Save size={16} /> Monat speichern</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default {
  id: 'erfassung',
  label: 'Erfassung',
  icon: ClipboardList,
  order: 10,
  Component: Erfassung,
};
