import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { COLORS, DEFAULT_INVESTMENT_CATEGORIES, getCategoryColor } from '../../core/theme.js';
import { fmtEUR, fmtEURDetailed, fmtPct, parseNumber } from '../../core/format.js';
import { getLinkTargets } from '../../core/finance.js';
import { usePlan } from '../../core/PlanContext.jsx';
import { Button, Card, Dot, EmptyState, IconButton, NumberField, Select, TextField } from '../../ui/components.jsx';

// Textfeld, das erst beim Verlassen speichert
function CommitTextField({ value, onCommit, ...rest }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  return (
    <TextField value={draft} onChange={e => setDraft(e.target.value)} enterKeyHint="done"
      onBlur={() => { if (draft !== (value || '')) onCommit(draft); }}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} {...rest} />
  );
}

function Label({ children }) {
  return <label className="block text-xs mb-1 mt-2" style={{ color: COLORS.textMuted }}>{children}</label>;
}

function Investments() {
  const { budget, investments, totals, addPosition, deletePosition, updatePosition } = usePlan();
  const totalPortfolio = totals.totalPortfolio;
  const [form, setForm] = useState({ name: '', wkn: '', category: '', value: '', zielId: '' });
  const linkTargets = getLinkTargets(budget);

  const submit = () => {
    const value = parseNumber(form.value);
    if (!form.name.trim() || value === '') return;
    addPosition({ name: form.name.trim(), wkn: form.wkn, category: form.category || 'Sonstiges', value, zielId: form.zielId || '' });
    setForm({ name: '', wkn: '', category: form.category, value: '', zielId: form.zielId });
  };

  const usedCategories = Array.from(new Set(investments.map(p => p.category || 'Sonstiges'))).sort();
  const allCategories = Array.from(new Set([...DEFAULT_INVESTMENT_CATEGORIES, ...usedCategories]));

  const categoryBreakdown = allCategories
    .map(cat => ({ name: cat, value: investments.filter(p => (p.category || 'Sonstiges') === cat).reduce((a, p) => a + (Number(p.value) || 0), 0), color: getCategoryColor(cat, usedCategories) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const sortedPositions = [...investments].sort((a, b) => (a.category || 'Sonstiges').localeCompare(b.category || 'Sonstiges') || a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <Card title="NEUER TITEL">
        <Label>Name</Label>
        <TextField value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>WKN</Label>
            <TextField value={form.wkn} autoCapitalize="characters" onChange={e => setForm({ ...form, wkn: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <Label>Wert (€)</Label>
            <TextField inputMode="decimal" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full text-right" />
          </div>
        </div>
        <Label>Kategorie</Label>
        <TextField list="kategorie-liste" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="z. B. ETF" />
        <datalist id="kategorie-liste">
          {allCategories.map(c => <option key={c} value={c} />)}
        </datalist>
        <Label>Ziel-Position (optional, für Forecast)</Label>
        <Select value={form.zielId} onChange={e => setForm({ ...form, zielId: e.target.value })} className="w-full">
          <option value="">Keine Verknüpfung</option>
          {linkTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
        <Button variant="primary" onClick={submit} className="w-full mt-4"><Plus size={18} /> Titel hinzufügen</Button>
      </Card>

      <Card title="KATEGORIEN">
        {categoryBreakdown.length === 0 ? <EmptyState text="Noch keine Titel erfasst." /> : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2} isAnimationActive={false}>
                  {categoryBreakdown.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtEURDetailed(v)} />
              </PieChart>
            </ResponsiveContainer>
            {categoryBreakdown.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm py-1">
                <span className="flex items-center gap-2"><Dot color={d.color} />{d.name}</span>
                <span className="tabular-nums" style={{ color: COLORS.textMuted }}>{totalPortfolio > 0 ? fmtPct(d.value / totalPortfolio) : '–'}</span>
              </div>
            ))}
          </>
        )}
      </Card>

      <Card title="PORTFOLIO-WERT" className="md:col-span-2 xl:col-span-1">
        <div className="text-3xl font-bold tabular-nums" style={{ color: COLORS.primary }}>{fmtEUR(totalPortfolio)}</div>
        <div className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{investments.length} Titel in {categoryBreakdown.length} Kategorien</div>
      </Card>

      <Card title="TITEL" className="md:col-span-2 xl:col-span-3">
        {sortedPositions.length === 0 ? <EmptyState text="Noch keine Titel erfasst." /> : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs" style={{ color: COLORS.textMuted }}>
                  <th className="py-1 font-medium">Titel</th>
                  <th className="py-1 font-medium">WKN</th>
                  <th className="py-1 font-medium">Kategorie</th>
                  <th className="py-1 font-medium text-right">Wert</th>
                  <th className="py-1 font-medium text-right">Anteil</th>
                  <th className="py-1 font-medium pl-3">Ziel (Forecast)</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map(p => (
                  <tr key={p.id} className="border-t" style={{ borderColor: COLORS.border }}>
                    <td className="py-1.5 pr-2">{p.name}</td>
                    <td className="py-1.5 pr-2" style={{ color: COLORS.textMuted }}>{p.wkn || '–'}</td>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Dot color={getCategoryColor(p.category || 'Sonstiges', usedCategories)} />
                        <CommitTextField list="kategorie-liste" value={p.category} onCommit={v => updatePosition(p.id, { category: v })} className="w-32 !h-10" />
                      </div>
                    </td>
                    <td className="py-1.5 text-right">
                      <NumberField value={p.value ?? ''} onCommit={v => updatePosition(p.id, { value: v })} aria-label={`Wert ${p.name}`} />
                    </td>
                    <td className="py-1.5 text-right tabular-nums" style={{ color: COLORS.textMuted }}>{totalPortfolio > 0 ? fmtPct((Number(p.value) || 0) / totalPortfolio) : '–'}</td>
                    <td className="py-1.5 pl-3">
                      <Select value={p.zielId || ''} onChange={e => updatePosition(p.id, { zielId: e.target.value })} className="!h-10 max-w-[220px]">
                        <option value="">–</option>
                        {linkTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </Select>
                    </td>
                    <td className="py-1.5 text-right">
                      <IconButton label={`${p.name} löschen`} onClick={() => deletePosition(p.id)}><Trash2 size={16} /></IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default {
  id: 'investments',
  label: 'Investments',
  icon: Briefcase,
  order: 30,
  Component: Investments,
};
