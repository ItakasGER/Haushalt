import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowDown, ArrowUp, Briefcase, Camera, Plus, Trash2 } from 'lucide-react';
import { COLORS, DEFAULT_INVESTMENT_CATEGORIES, getCategoryColor } from '../../core/theme.js';
import { fmtEUR, fmtEURDetailed, fmtPct, monthLabel, parseNumber, todayISO } from '../../core/format.js';
import { getLinkTargets } from '../../core/finance.js';
import { portfolioPL, positionPL } from '../../core/performance.js';
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

const plColor = (v) => (v > 0 ? COLORS.income : v < 0 ? COLORS.expense : COLORS.textMuted);
const signed = (text, v) => (v > 0 ? `+${text}` : text);

const SORTS = {
  kategorie: (a, b) => (a.category || 'Sonstiges').localeCompare(b.category || 'Sonstiges') || a.name.localeCompare(b.name),
  titel: (a, b) => a.name.localeCompare(b.name),
  wert: (a, b) => (Number(a.value) || 0) - (Number(b.value) || 0),
  gv: (a, b) => (positionPL(a)?.plPct ?? -Infinity) - (positionPL(b)?.plPct ?? -Infinity),
};

function SortHeader({ id, sort, setSort, align = 'left', children }) {
  const active = sort.key === id;
  const Icon = sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={`py-1 font-medium ${align === 'right' ? 'text-right' : ''}`}>
      <button onClick={() => setSort({ key: id, dir: active ? -sort.dir : (id === 'wert' || id === 'gv' ? -1 : 1) })}
        className="inline-flex items-center gap-0.5 min-h-[32px]" style={{ color: active ? COLORS.primary : COLORS.textMuted }}>
        {children}{active && <Icon size={12} />}
      </button>
    </th>
  );
}

function Investments() {
  const { budget, investments, depotHistory, totals, addPosition, deletePosition, updatePosition, takeDepotSnapshot } = usePlan();
  const totalPortfolio = totals.totalPortfolio;
  const [form, setForm] = useState({ name: '', wkn: '', category: '', value: '', invested: '', zielId: '' });
  const [sort, setSort] = useState({ key: 'kategorie', dir: 1 });
  const [snapMonth, setSnapMonth] = useState(todayISO().slice(0, 7));
  const [savedMonth, setSavedMonth] = useState(null);
  const pf = portfolioPL(investments);
  const lastSnapshot = depotHistory[depotHistory.length - 1];
  const linkTargets = getLinkTargets(budget);

  const submit = () => {
    const value = parseNumber(form.value);
    if (!form.name.trim() || value === '') return;
    addPosition({ name: form.name.trim(), wkn: form.wkn, category: form.category || 'Sonstiges', value, invested: parseNumber(form.invested), zielId: form.zielId || '' });
    setForm({ name: '', wkn: '', category: form.category, value: '', invested: '', zielId: form.zielId });
  };

  const usedCategories = Array.from(new Set(investments.map(p => p.category || 'Sonstiges'))).sort();
  const allCategories = Array.from(new Set([...DEFAULT_INVESTMENT_CATEGORIES, ...usedCategories]));

  const categoryBreakdown = allCategories
    .map(cat => ({ name: cat, value: investments.filter(p => (p.category || 'Sonstiges') === cat).reduce((a, p) => a + (Number(p.value) || 0), 0), color: getCategoryColor(cat, usedCategories) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const sortedPositions = [...investments].sort((a, b) => sort.dir * SORTS[sort.key](a, b));

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
            <Label>Kategorie</Label>
            <TextField list="kategorie-liste" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="z. B. ETF" />
          </div>
          <div>
            <Label>Aktueller Wert (€)</Label>
            <TextField inputMode="decimal" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full text-right" />
          </div>
          <div>
            <Label>Einstandswert (€, optional)</Label>
            <TextField inputMode="decimal" value={form.invested} onChange={e => setForm({ ...form, invested: e.target.value })} className="w-full text-right" placeholder="investiert" />
          </div>
        </div>
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

      <Card title="DEPOT" className="md:col-span-2 xl:col-span-1">
        <div className="text-3xl font-bold tabular-nums" style={{ color: COLORS.primary }}>{fmtEUR(totalPortfolio)}</div>
        <div className="text-sm mt-1" style={{ color: COLORS.textMuted }}>{investments.length} Titel in {categoryBreakdown.length} Kategorien</div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          <div>
            <div className="text-xs" style={{ color: COLORS.textMuted }}>Einstandswert</div>
            <div className="text-base font-semibold tabular-nums">{pf.coveredCount > 0 ? fmtEUR(pf.invested) : '–'}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: COLORS.textMuted }}>Gewinn / Verlust</div>
            <div className="text-base font-semibold tabular-nums" style={{ color: pf.coveredCount > 0 ? plColor(pf.pl) : COLORS.textMuted }}>
              {pf.coveredCount > 0 ? `${signed(fmtEUR(pf.pl), pf.pl)} · ${signed(fmtPct(pf.plPct), pf.pl)}` : '–'}
            </div>
          </div>
        </div>
        {investments.length > 0 && !pf.complete && (
          <div className="text-xs mt-2" style={{ color: COLORS.warn }}>
            Einstandswert fehlt bei {investments.length - pf.coveredCount} von {investments.length} Titeln – G/V bezieht sich nur auf die erfassten.
          </div>
        )}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          <div className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>
            Monatsstand für die Wertentwicklung festhalten{lastSnapshot ? ` · zuletzt ${monthLabel(lastSnapshot.month)}` : ''}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={snapMonth} max={todayISO().slice(0, 7)} onChange={e => setSnapMonth(e.target.value)}
              className="h-11 px-2 rounded-lg border bg-white" style={{ borderColor: COLORS.border, fontSize: 16 }} aria-label="Monat des Depotstands" />
            <Button variant="primary" disabled={investments.length === 0 || !snapMonth} onClick={() => setSavedMonth(takeDepotSnapshot(snapMonth))}>
              <Camera size={16} /> Depotstand speichern
            </Button>
            {savedMonth && <span className="text-sm" style={{ color: COLORS.income }}>{monthLabel(savedMonth)} gespeichert ✓</span>}
          </div>
        </div>
      </Card>

      <Card title="TITEL" className="md:col-span-2 xl:col-span-3">
        {sortedPositions.length === 0 ? <EmptyState text="Noch keine Titel erfasst." /> : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[940px]">
              <thead>
                <tr className="text-left text-xs" style={{ color: COLORS.textMuted }}>
                  <SortHeader id="titel" sort={sort} setSort={setSort}>Titel</SortHeader>
                  <SortHeader id="kategorie" sort={sort} setSort={setSort}>Kategorie</SortHeader>
                  <SortHeader id="wert" sort={sort} setSort={setSort} align="right">Wert</SortHeader>
                  <th className="py-1 font-medium text-right">Einstand</th>
                  <SortHeader id="gv" sort={sort} setSort={setSort} align="right">G/V</SortHeader>
                  <th className="py-1 font-medium text-right">Anteil</th>
                  <th className="py-1 font-medium pl-3">Ziel (Forecast)</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map(p => { const pl = positionPL(p); return (
                  <tr key={p.id} className="border-t" style={{ borderColor: COLORS.border }}>
                    <td className="py-1.5 pr-2">
                      <div>{p.name}</div>
                      {p.wkn && <div className="text-xs" style={{ color: COLORS.textMuted }}>{p.wkn}</div>}
                    </td>
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Dot color={getCategoryColor(p.category || 'Sonstiges', usedCategories)} />
                        <CommitTextField list="kategorie-liste" value={p.category} onCommit={v => updatePosition(p.id, { category: v })} className="w-28 !h-10" />
                      </div>
                    </td>
                    <td className="py-1.5 text-right">
                      <NumberField value={p.value ?? ''} onCommit={v => updatePosition(p.id, { value: v })} aria-label={`Wert ${p.name}`} className="w-24" />
                    </td>
                    <td className="py-1.5 text-right pl-2">
                      <NumberField value={p.invested ?? ''} onCommit={v => updatePosition(p.id, { invested: v })} aria-label={`Einstand ${p.name}`} className="w-24" placeholder="–" />
                    </td>
                    <td className="py-1.5 text-right tabular-nums pl-3 whitespace-nowrap" style={{ color: pl ? plColor(pl.pl) : COLORS.textMuted }}>
                      {pl ? <><div className="font-medium">{signed(fmtEUR(pl.pl), pl.pl)}</div><div className="text-xs">{signed(fmtPct(pl.plPct), pl.pl)}</div></> : '–'}
                    </td>
                    <td className="py-1.5 text-right tabular-nums pl-4 whitespace-nowrap" style={{ color: COLORS.textMuted }}>{totalPortfolio > 0 ? fmtPct((Number(p.value) || 0) / totalPortfolio) : '–'}</td>
                    <td className="py-1.5 pl-3">
                      <Select value={p.zielId || ''} onChange={e => updatePosition(p.id, { zielId: e.target.value })} className="!h-10 max-w-[170px]">
                        <option value="">–</option>
                        {linkTargets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </Select>
                    </td>
                    <td className="py-1.5 text-right">
                      <IconButton label={`${p.name} löschen`} onClick={() => deletePosition(p.id)}><Trash2 size={16} /></IconButton>
                    </td>
                  </tr>
                ); })}
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
