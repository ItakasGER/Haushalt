import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineIcon, PiggyBank, Target, TrendingUp, Wallet } from 'lucide-react';
import { COLORS, STRUKTUR_COLORS } from '../../core/theme.js';
import { fmtEUR, fmtEURDetailed } from '../../core/format.js';
import { futureValue, LINK_GROUP_LABELS } from '../../core/finance.js';
import { usePlan, useModuleData } from '../../core/PlanContext.jsx';
import { Card, Dot, EmptyState, NumberField, SummaryCard } from '../../ui/components.jsx';

const SCENARIOS = {
  konservativ: { label: 'Konservativ', delta: -2 },
  basis: { label: 'Basis', delta: 0 },
  optimistisch: { label: 'Optimistisch', delta: 2 },
};
// Horizont → Stützjahre für die Tabellen
const HORIZONS = { 5: [1, 3, 5], 10: [1, 5, 10], 20: [5, 10, 20], 30: [10, 20, 30] };
const DEFAULT_SETTINGS = { horizon: 5, real: false, inflation: 2, target: '' };
const GROUPS = Object.keys(LINK_GROUP_LABELS);

function Forecast() {
  const { budget, investments, updateItem } = usePlan();
  const [scenario, setScenario] = useState('basis');
  const [stored, setSettings] = useModuleData('forecast', DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  const horizon = HORIZONS[settings.horizon] ? settings.horizon : 5;
  const FORECAST_YEARS = HORIZONS[horizon];
  const CHART_YEARS = Array.from({ length: horizon + 1 }, (_, i) => i);
  const inflation = Math.max(Number(settings.inflation) || 0, 0);
  const target = Number(settings.target) || 0;
  const update = (patch) => setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }));
  // In heutiger Kaufkraft: Endwert durch die aufgelaufene Inflation teilen
  const deflate = (value, years) => (settings.real ? value / Math.pow(1 + inflation / 100, years) : value);
  const fv = (r, years) => deflate(futureValue(r.currentValue, r.monthly, r.rendite, r.verbrauch, years), years);
  const delta = SCENARIOS[scenario].delta;

  const rows = GROUPS.flatMap(group =>
    (budget[group] || []).map(item => {
      const linked = investments.filter(p => p.zielId === item.id);
      const currentValue = linked.reduce((a, p) => a + (Number(p.value) || 0), 0);
      const monthly = Number(item.amount) || 0;
      const rendite = Math.max((Number(item.rendite) || 0) + delta, 0);
      const verbrauch = Number(item.verbrauch) || 0;
      return { group, item, linked, currentValue, monthly, rendite, verbrauch };
    })
  );

  const totalCurrentValue = rows.reduce((a, r) => a + r.currentValue, 0);
  const totalMonthly = rows.reduce((a, r) => a + r.monthly, 0);
  const totalInYears = (years) => rows.reduce((a, r) => a + fv(r, years), 0);
  // Erstes Jahr (bis 60), in dem das Zielvermögen erreicht wird
  let targetYear = null;
  if (target > 0) for (let y = 0; y <= 60; y++) { if (totalInYears(y) >= target) { targetYear = y; break; } }

  const chartData = CHART_YEARS.map(year => {
    const point = { year: `${year}J` };
    GROUPS.forEach(group => {
      point[group] = rows.filter(r => r.group === group)
        .reduce((a, r) => a + fv(r, year), 0);
    });
    return point;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>SZENARIO</span>
        <div className="inline-flex rounded-lg p-1 gap-1" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button key={key} onClick={() => setScenario(key)} className="min-h-[40px] px-3 rounded-md text-sm font-medium"
              style={{ backgroundColor: scenario === key ? COLORS.primary : 'transparent', color: scenario === key ? '#fff' : COLORS.textMuted }}>
              {s.label}{s.delta !== 0 ? ` (${s.delta > 0 ? '+' : ''}${s.delta} %-Pkt.)` : ''}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold ml-2" style={{ color: COLORS.textMuted }}>HORIZONT</span>
        <div className="inline-flex rounded-lg p-1 gap-1" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          {Object.keys(HORIZONS).map(h => (
            <button key={h} onClick={() => update({ horizon: Number(h) })} className="min-h-[40px] px-3 rounded-md text-sm font-medium"
              style={{ backgroundColor: horizon === Number(h) ? COLORS.primary : 'transparent', color: horizon === Number(h) ? '#fff' : COLORS.textMuted }}>
              {h} J
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <label className="flex items-center gap-2 text-sm min-h-[40px]">
          <input type="checkbox" checked={settings.real} onChange={e => update({ real: e.target.checked })} className="w-5 h-5" style={{ accentColor: COLORS.primary }} />
          In heutiger Kaufkraft (inflationsbereinigt)
        </label>
        <span className="flex items-center gap-2 text-sm" style={{ opacity: settings.real ? 1 : 0.45 }}>
          Inflation p.a.
          <NumberField value={settings.inflation} suffix="%" className="w-16" onCommit={v => update({ inflation: v })} aria-label="Inflation" disabled={!settings.real} />
        </span>
        <span className="flex items-center gap-2 text-sm">
          <Target size={16} style={{ color: COLORS.textMuted }} /> Zielvermögen
          <NumberField value={settings.target} suffix="€" className="w-28" onCommit={v => update({ target: v })} aria-label="Zielvermögen" placeholder="optional" />
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Wallet size={16} />} label="Verknüpfter Depotwert" value={fmtEUR(totalCurrentValue)}
          sub={`${investments.filter(p => p.zielId).length} von ${investments.length} Titeln verknüpft`} />
        <SummaryCard icon={<PiggyBank size={16} />} label="Monatliche Sparrate" value={fmtEUR(totalMonthly)} sub="Altersvorsorge + Sparen + Investieren" />
        <SummaryCard icon={<TrendingUp size={16} />} label={`Prognose in ${horizon} Jahren`} value={fmtEUR(totalInYears(horizon))}
          sub={settings.real ? `in heutiger Kaufkraft (${String(inflation).replace('.', ',')} % Inflation)` : 'nominal'} />
        {target > 0
          ? <SummaryCard icon={<Target size={16} />} label={`Ziel ${fmtEUR(target)}`} value={targetYear === null ? '> 60 Jahre' : targetYear === 0 ? 'erreicht' : `in ${targetYear} ${targetYear === 1 ? 'Jahr' : 'Jahren'}`}
              valueColor={targetYear !== null && targetYear <= horizon ? COLORS.income : COLORS.warn}
              sub={targetYear !== null && targetYear > 0 ? `im Jahr ${new Date().getFullYear() + targetYear}` : targetYear === null ? 'Sparrate oder Rendite zu niedrig' : ''} />
          : <SummaryCard icon={<TrendingUp size={16} />} label="Prognose in 1 Jahr" value={fmtEUR(totalInYears(1))} sub={settings.real ? 'in heutiger Kaufkraft' : 'nominal'} />}
      </div>

      <Card title={`VERMÖGENSPROGNOSE ${horizon} JAHRE · ${SCENARIOS[scenario].label.toUpperCase()} · ${settings.real ? 'REAL' : 'NOMINAL'}`}>
        {totalCurrentValue === 0 && totalMonthly === 0 ? <EmptyState text="Noch keine Beiträge oder verknüpften Titel." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} interval={horizon > 10 ? 4 : 0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtEURDetailed(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {target > 0 && <ReferenceLine y={target} stroke={COLORS.expense} strokeDasharray="6 4" label={{ value: `Ziel ${fmtEUR(target)}`, position: 'insideTopLeft', fontSize: 11, fill: COLORS.expense }} />}
              {GROUPS.map(g => (
                <Area key={g} type="monotone" dataKey={g} name={LINK_GROUP_LABELS[g]} stackId="1"
                  stroke={STRUKTUR_COLORS[LINK_GROUP_LABELS[g]]} fill={STRUKTUR_COLORS[LINK_GROUP_LABELS[g]]} fillOpacity={0.55} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {GROUPS.map(group => (
        <Card key={group} title={<span className="flex items-center gap-1.5"><Dot color={STRUKTUR_COLORS[LINK_GROUP_LABELS[group]]} />{LINK_GROUP_LABELS[group].toUpperCase()}</span>}>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs" style={{ color: COLORS.textMuted }}>
                  <th className="py-1 font-medium">Produkt</th>
                  <th className="py-1 font-medium">Verknüpft</th>
                  <th className="py-1 font-medium text-right">Aktueller Wert</th>
                  <th className="py-1 font-medium text-right">Monatl. Beitrag</th>
                  <th className="py-1 font-medium text-right">Rendite p.a.</th>
                  <th className="py-1 font-medium text-right">Verbrauch p.a.</th>
                  {FORECAST_YEARS.map(y => <th key={y} className="py-1 font-medium text-right">in {y}J</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.filter(r => r.group === group).length === 0 && (
                  <tr><td colSpan={6 + FORECAST_YEARS.length} className="py-3 text-center" style={{ color: COLORS.textMuted }}>Keine Positionen – in der Erfassung anlegen.</td></tr>
                )}
                {rows.filter(r => r.group === group).map(r => (
                  <tr key={r.item.id} className="border-t" style={{ borderColor: COLORS.border }}>
                    <td className="py-1.5 pr-2">{r.item.name}</td>
                    <td className="py-1.5" style={{ color: COLORS.textMuted }}>{r.linked.length > 0 ? `${r.linked.length} Titel` : '–'}</td>
                    <td className="py-1.5 text-right tabular-nums">{fmtEUR(r.currentValue)}</td>
                    <td className="py-1.5 text-right tabular-nums">{fmtEUR(r.monthly)}</td>
                    <td className="py-1.5 text-right">
                      <NumberField value={r.item.rendite ?? ''} suffix="%" className="w-16"
                        onCommit={v => updateItem(r.group, r.item.id, { rendite: v })} aria-label={`Rendite ${r.item.name}`} />
                      {delta !== 0 && <div className="text-xs" style={{ color: COLORS.textMuted }}>→ {r.rendite.toFixed(1).replace('.', ',')} %</div>}
                    </td>
                    <td className="py-1.5 text-right">
                      <NumberField value={r.item.verbrauch ?? ''} suffix="%" className="w-16"
                        onCommit={v => updateItem(r.group, r.item.id, { verbrauch: v })} aria-label={`Verbrauch ${r.item.name}`} />
                    </td>
                    {FORECAST_YEARS.map(y => (
                      <td key={y} className="py-1.5 text-right font-medium tabular-nums">{fmtEUR(fv(r, y))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default {
  id: 'forecast',
  label: 'Forecast',
  icon: LineIcon,
  order: 40,
  Component: Forecast,
};
