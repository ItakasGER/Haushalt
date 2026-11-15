// Depot-Analyse: Wertentwicklung und Rendite aus Monatsständen, Soll/Ist-Allokation
// mit Rebalancing, größte Positionen und Gewinn/Verlust je Titel.
import React, { useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Percent, Plus, Scale, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { COLORS, getCategoryColor } from '../../core/theme.js';
import { fmtEUR, fmtEURDetailed, fmtPct, parseNumber, todayISO } from '../../core/format.js';
import { performanceSeries, portfolioPL, positionPL } from '../../core/performance.js';
import { allocationRows } from '../../core/allocation.js';
import { usePlan, useModuleData } from '../../core/PlanContext.jsx';
import { Button, Card, Dot, EmptyState, IconButton, NumberField, SummaryCard, TextField } from '../../ui/components.jsx';

const plColor = (v) => (v > 0 ? COLORS.income : v < 0 ? COLORS.expense : COLORS.textMuted);
const signed = (text, v) => (v > 0 ? `+${text}` : text);
const fmtPP = (v) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1).replace('.', ',')} %-Pkt.`;

function Wertentwicklung({ perf }) {
  const { addDepotHistoryEntry, deleteDepotSnapshot } = usePlan();
  const [form, setForm] = useState({ month: '', total: '', invested: '' });
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const rows = perf.rows;

  const add = () => {
    const total = parseNumber(form.total);
    if (!form.month || total === '') return;
    addDepotHistoryEntry({ month: form.month, total, invested: parseNumber(form.invested) });
    setForm({ month: '', total: '', invested: '' });
  };

  return (
    <>
      <Card title="WERTENTWICKLUNG" className="md:col-span-2">
        {rows.length < 2 ? (
          <EmptyState text={rows.length === 0
            ? 'Noch kein Monatsstand gespeichert. Unter „Investments“ auf „Depotstand speichern“ tippen – ab zwei Ständen erscheint hier der Verlauf.'
            : 'Ein Monatsstand vorhanden – ab dem zweiten erscheinen Verlauf und Rendite. Ältere Stände lassen sich unten nachtragen.'} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
              <Tooltip formatter={(v) => fmtEURDetailed(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name="Depotwert" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
              <Line type="stepAfter" dataKey="invested" name="Einstandswert (investiert)" stroke={COLORS.textMuted} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="MONATSSTÄNDE" className="md:col-span-2"
        right={<Button onClick={() => setShowForm(!showForm)} className="!min-h-[36px] !px-3"><Plus size={16} /> Stand nachtragen</Button>}>
        {showForm && (
          <div className="flex flex-wrap items-end gap-2 mb-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.bg }}>
            <label className="text-xs" style={{ color: COLORS.textMuted }}>Monat<br />
              <input type="month" value={form.month} max={todayISO().slice(0, 7)} onChange={e => setForm({ ...form, month: e.target.value })}
                className="h-11 px-2 rounded-lg border bg-white" style={{ borderColor: COLORS.border, fontSize: 16, color: COLORS.textDark }} />
            </label>
            <label className="text-xs" style={{ color: COLORS.textMuted }}>Depotwert (€)<br />
              <TextField inputMode="decimal" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} className="w-32 text-right" />
            </label>
            <label className="text-xs" style={{ color: COLORS.textMuted }}>Einstandswert (€)<br />
              <TextField inputMode="decimal" value={form.invested} onChange={e => setForm({ ...form, invested: e.target.value })} className="w-32 text-right" />
            </label>
            <Button variant="primary" onClick={add} disabled={!form.month || form.total === ''}>Hinzufügen</Button>
          </div>
        )}
        {rows.length === 0 ? <EmptyState text="Noch keine Monatsstände." /> : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs" style={{ color: COLORS.textMuted }}>
                  <th className="py-1 font-medium">Monat</th>
                  <th className="py-1 font-medium text-right">Depotwert</th>
                  <th className="py-1 font-medium text-right">Einstand</th>
                  <th className="py-1 font-medium text-right">G/V</th>
                  <th className="py-1 font-medium text-right">Zufluss</th>
                  <th className="py-1 font-medium text-right">Rendite Monat</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().slice(0, showAll ? rows.length : 6).map(r => (
                  <tr key={r.month} className="border-t" style={{ borderColor: COLORS.border }}>
                    <td className="py-1">{r.label}{r.manual && <span className="text-xs ml-1.5" style={{ color: COLORS.textMuted }}>nachgetragen</span>}</td>
                    <td className="py-1 text-right tabular-nums font-medium">{fmtEUR(r.total)}</td>
                    <td className="py-1 text-right tabular-nums">{r.invested !== null ? fmtEUR(r.invested) : '–'}</td>
                    <td className="py-1 text-right tabular-nums" style={{ color: r.pl !== null ? plColor(r.pl) : COLORS.textMuted }}>{r.pl !== null ? signed(fmtEUR(r.pl), r.pl) : '–'}</td>
                    <td className="py-1 text-right tabular-nums" style={{ color: COLORS.textMuted }}>{r.flow !== null ? signed(fmtEUR(r.flow), r.flow) : '–'}</td>
                    <td className="py-1 text-right tabular-nums" style={{ color: r.ret !== null ? plColor(r.ret) : COLORS.textMuted }}>{r.ret !== null ? signed(fmtPct(r.ret), r.ret) : '–'}</td>
                    <td className="py-1 text-right"><IconButton label={`Stand ${r.label} löschen`} onClick={() => deleteDepotSnapshot(r.month)}><Trash2 size={16} /></IconButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 6 && (
          <button onClick={() => setShowAll(!showAll)} className="min-h-[40px] text-sm font-medium" style={{ color: COLORS.primary }}>
            {showAll ? 'Nur die letzten 6 zeigen' : `Alle ${rows.length} Monatsstände zeigen`}
          </button>
        )}
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          Rendite zeitgewichtet (Modified Dietz): Kursentwicklung ohne den Effekt von Einzahlungen. Als Zufluss gilt die Veränderung des Einstandswerts.
        </p>
      </Card>
    </>
  );
}

function Allokation() {
  const { budget, investments } = usePlan();
  const [settings, setSettings] = useModuleData('depot-analyse', { targets: {} });
  const targets = settings.targets || {};
  const alloc = allocationRows(investments, targets);
  const cats = alloc.rows.map(r => r.name);
  const monthly = ['altersvorsorge', 'investieren'].reduce((a, g) => a + (budget[g] || []).reduce((x, it) => x + (Number(it.amount) || 0), 0), 0);
  const sumOk = Math.abs(alloc.sollSum - 100) < 0.01;
  const maxShare = Math.max(...alloc.rows.map(r => Math.max(r.ist, r.soll)), 0.01);

  const setTarget = (name, v) => setSettings(prev => ({ ...prev, targets: { ...(prev.targets || {}), [name]: v } }));
  const useCurrent = () => setSettings(prev => ({ ...prev, targets: Object.fromEntries(alloc.rows.map(r => [r.name, Math.round(r.ist * 100)])) }));

  return (
    <Card title="ALLOKATION: SOLL / IST" className="md:col-span-2"
      right={!alloc.hasTargets && alloc.rows.length > 0 ? <Button onClick={useCurrent} className="!min-h-[36px] !px-3">Ist als Soll übernehmen</Button> : null}>
      {alloc.rows.length === 0 ? <EmptyState text="Noch keine Titel erfasst." /> : (
        <>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[660px]">
              <thead>
                <tr className="text-left text-xs" style={{ color: COLORS.textMuted }}>
                  <th className="py-1 font-medium">Kategorie</th>
                  <th className="py-1 font-medium w-[30%]">Ist ▬ / Soll ▏</th>
                  <th className="py-1 font-medium text-right">Ist</th>
                  <th className="py-1 font-medium text-right">Soll</th>
                  <th className="py-1 font-medium text-right">Abweichung</th>
                  <th className="py-1 font-medium text-right">Rebalancing</th>
                </tr>
              </thead>
              <tbody>
                {alloc.rows.map(r => {
                  const color = getCategoryColor(r.name, cats);
                  const off = r.diff !== null && Math.abs(r.diff) >= 0.05;
                  return (
                    <tr key={r.name} className="border-t" style={{ borderColor: COLORS.border }}>
                      <td className="py-1.5 pr-2"><span className="inline-flex items-center gap-2"><Dot color={color} />{r.name}</span></td>
                      <td className="py-1.5 pr-3">
                        <div className="relative h-3 rounded" style={{ backgroundColor: COLORS.bg }}>
                          <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(r.ist / maxShare) * 100}%`, backgroundColor: color }} />
                          {alloc.hasTargets && <div className="absolute -inset-y-1 w-0.5" style={{ left: `${(r.soll / maxShare) * 100}%`, backgroundColor: COLORS.textDark }} />}
                        </div>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{fmtPct(r.ist)}<div className="text-xs" style={{ color: COLORS.textMuted }}>{fmtEUR(r.value)}</div></td>
                      <td className="py-1.5 text-right pl-2">
                        <NumberField value={targets[r.name] ?? ''} suffix="%" className="w-16" onCommit={v => setTarget(r.name, v)} aria-label={`Soll ${r.name}`} />
                      </td>
                      <td className="py-1.5 text-right tabular-nums" style={{ color: r.diff === null ? COLORS.textMuted : off ? COLORS.warn : COLORS.income }}>
                        {r.diff === null ? '–' : fmtPP(r.diff)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-medium">
                        {r.rebalance === null || !sumOk ? '–' : Math.abs(r.rebalance) < 1 ? '±0 €' : `${r.rebalance > 0 ? 'Kauf' : 'Verkauf'} ${fmtEUR(Math.abs(r.rebalance))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-sm mt-3 space-y-1">
            {alloc.hasTargets && !sumOk && (
              <div style={{ color: COLORS.expense }}>Soll-Summe {alloc.sollSum.toFixed(1).replace('.', ',')} % – muss 100 % ergeben, damit Rebalancing-Beträge berechnet werden.</div>
            )}
            {!alloc.hasTargets && <div style={{ color: COLORS.textMuted }}>Zielgewichte je Kategorie eintragen, um Abweichung und Rebalancing-Beträge zu sehen.</div>}
            {alloc.contributionOnly !== null && (
              <div style={{ color: COLORS.textMuted }}>
                {alloc.contributionOnly === Infinity
                  ? 'Ohne Verkäufe nicht erreichbar: Eine Kategorie mit Bestand hat 0 % Soll.'
                  : alloc.contributionOnly < 1
                    ? 'Allokation liegt auf Ziel.'
                    : <>Ohne Verkäufe erreichbar mit <b style={{ color: COLORS.textDark }}>{fmtEUR(alloc.contributionOnly)}</b> frischem Geld in die untergewichteten Kategorien{monthly > 0 ? <> – bei deiner Sparrate von {fmtEUR(monthly)}/Monat (Altersvorsorge + Investieren) in ca. <b style={{ color: COLORS.textDark }}>{Math.ceil(alloc.contributionOnly / monthly)} Monaten</b></> : ''}.</>}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function BarList({ rows, format, colorOf }) {
  const max = Math.max(...rows.map(r => Math.abs(r.amount)), 1);
  return rows.map(r => (
    <div key={r.id} className="py-1.5">
      <div className="flex items-center justify-between text-sm gap-2">
        <span className="truncate">{r.name}</span>
        <span className="tabular-nums flex-shrink-0" style={{ color: colorOf(r) }}>{format(r)}</span>
      </div>
      <div className="h-1.5 rounded mt-1" style={{ backgroundColor: COLORS.bg }}>
        <div className="h-full rounded" style={{ width: `${(Math.abs(r.amount) / max) * 100}%`, backgroundColor: colorOf(r) }} />
      </div>
    </div>
  ));
}

function DepotAnalyse() {
  const { investments, depotHistory } = usePlan();
  const pf = portfolioPL(investments);
  const perf = performanceSeries(depotHistory);

  const byWeight = [...investments].map(p => ({ id: p.id, name: p.name, amount: Number(p.value) || 0 })).sort((a, b) => b.amount - a.amount);
  const top3 = pf.total > 0 ? byWeight.slice(0, 3).reduce((a, r) => a + r.amount, 0) / pf.total : 0;
  const byPL = investments.map(p => ({ id: p.id, name: p.name, pl: positionPL(p) })).filter(r => r.pl)
    .map(r => ({ ...r, amount: r.pl.pl })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Wallet size={16} />} label="Depotwert" value={fmtEUR(pf.total)} sub={`${investments.length} Titel`} />
        <SummaryCard icon={<Scale size={16} />} label="Einstandswert" value={pf.coveredCount > 0 ? fmtEUR(pf.invested) : '–'}
          sub={pf.complete ? 'für alle Titel erfasst' : `${pf.coveredCount} von ${investments.length} Titeln erfasst`} subColor={pf.complete ? COLORS.textMuted : COLORS.warn} />
        <SummaryCard icon={<TrendingUp size={16} />} label="Gewinn / Verlust" value={pf.coveredCount > 0 ? signed(fmtEUR(pf.pl), pf.pl) : '–'}
          valueColor={pf.coveredCount > 0 ? plColor(pf.pl) : undefined} sub={pf.plPct !== null ? `${signed(fmtPct(pf.plPct), pf.pl)} auf den Einstand` : 'Einstandswerte erfassen'} />
        <SummaryCard icon={<Percent size={16} />} label={perf.twrPa !== null ? 'Rendite p.a. (zeitgewichtet)' : 'Rendite (zeitgewichtet)'}
          value={perf.twr !== null ? signed(fmtPct(perf.twrPa !== null ? perf.twrPa : perf.twr), perf.twr) : '–'} valueColor={perf.twr !== null ? plColor(perf.twr) : undefined}
          sub={perf.twr !== null ? `seit ${perf.since} · ${perf.months} Mon.${perf.twrPa !== null ? ` · gesamt ${signed(fmtPct(perf.twr), perf.twr)}` : ''}` : 'ab zwei Monatsständen'} />
      </div>

      <Wertentwicklung perf={perf} />
      <Allokation />

      <Card title="GRÖSSTE POSITIONEN" right={pf.total > 0 ? <span className="text-xs" style={{ color: COLORS.textMuted }}>Top 3: {fmtPct(top3)}</span> : null}>
        {byWeight.length === 0 ? <EmptyState text="Noch keine Titel erfasst." /> : (
          <BarList rows={byWeight.slice(0, 6)} colorOf={() => COLORS.primary} format={r => `${fmtEUR(r.amount)} · ${fmtPct(pf.total > 0 ? r.amount / pf.total : 0)}`} />
        )}
      </Card>

      <Card title="GEWINN / VERLUST JE TITEL">
        {byPL.length === 0 ? <EmptyState text="Einstandswerte unter „Investments“ erfassen." /> : (
          <BarList rows={byPL} colorOf={r => plColor(r.amount)} format={r => `${signed(fmtEUR(r.amount), r.amount)} · ${signed(fmtPct(r.pl.plPct), r.amount)}`} />
        )}
      </Card>
    </div>
  );
}

export default {
  id: 'depot-analyse',
  label: 'Depot-Analyse',
  icon: Activity,
  order: 35,
  showSummary: false,
  Component: DepotAnalyse,
};
