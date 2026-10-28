import React from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { COLORS, STRUKTUR_COLORS } from '../../core/theme.js';
import { fmtEUR, fmtEURDetailed, fmtPct, monthLabel } from '../../core/format.js';
import { usePlan } from '../../core/PlanContext.jsx';
import { Card, Dot, EmptyState } from '../../ui/components.jsx';

function IncomeFlowDiagram({ einnahmen, fixkosten, flexkosten, fcf }) {
  if (!einnahmen || einnahmen <= 0) return <EmptyState text="Noch keine Daten." />;

  const width = 680;
  const bandHeight = 200;
  const padY = 12;
  const nodeWidth = 12;
  const leftX = 100;
  const rightX = 480;
  const gap = 14;

  const segments = [
    { name: 'Fixkosten', amount: fixkosten, color: COLORS.expense },
    { name: 'Flexkosten', amount: flexkosten, color: COLORS.warn },
    { name: 'Free Cash Flow', amount: Math.max(fcf, 0), color: COLORS.income },
  ];

  let cumLeft = 0;
  const leftSegments = segments.map(s => {
    const y0 = padY + (cumLeft / einnahmen) * bandHeight;
    cumLeft += s.amount;
    const y1 = padY + (cumLeft / einnahmen) * bandHeight;
    return { ...s, y0, y1 };
  });

  const availableHeight = bandHeight - gap * (segments.length - 1);
  let cumRight = 0;
  const rightSegments = segments.map(s => {
    const h = Math.max((s.amount / einnahmen) * availableHeight, 0);
    const y0 = padY + cumRight;
    const y1 = y0 + h;
    cumRight += h + gap;
    return { ...s, y0, y1 };
  });

  const midX = (leftX + nodeWidth + rightX) / 2;
  const bandPath = (l, r) =>
    `M ${leftX + nodeWidth} ${l.y0} C ${midX} ${l.y0}, ${midX} ${r.y0}, ${rightX} ${r.y0} L ${rightX} ${r.y1} C ${midX} ${r.y1}, ${midX} ${l.y1}, ${leftX + nodeWidth} ${l.y1} Z`;

  return (
    <svg width="100%" height={bandHeight + padY * 2} viewBox={`0 0 ${width} ${bandHeight + padY * 2}`} preserveAspectRatio="xMidYMid meet">
      {leftSegments.map((l, i) => (
        <path key={l.name} d={bandPath(l, rightSegments[i])} fill={l.color} opacity={0.28} />
      ))}
      <rect x={leftX} y={padY} width={nodeWidth} height={bandHeight} fill={COLORS.primary} rx={2} />
      <text x={leftX - 8} y={padY + bandHeight / 2 - 6} textAnchor="end" fontSize="12" fontWeight="600" fill={COLORS.textDark}>Einnahmen</text>
      <text x={leftX - 8} y={padY + bandHeight / 2 + 10} textAnchor="end" fontSize="11" fill={COLORS.textMuted}>{fmtEUR(einnahmen)}</text>
      {rightSegments.map(r => (
        <g key={r.name}>
          <rect x={rightX} y={r.y0} width={nodeWidth} height={Math.max(r.y1 - r.y0, 1.5)} fill={r.color} rx={2} />
          <text x={rightX + nodeWidth + 8} y={(r.y0 + r.y1) / 2 - 6} fontSize="12" fontWeight="600" fill={COLORS.textDark}>{r.name}</text>
          <text x={rightX + nodeWidth + 8} y={(r.y0 + r.y1) / 2 + 10} fontSize="11" fill={COLORS.textMuted}>
            {fmtEUR(r.amount)} · {fmtPct(r.amount / einnahmen)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Auswertung() {
  const { budget, totals: t } = usePlan();

  const strukturData = [
    { name: 'Fixkosten', value: t.fixkostenGesamt },
    { name: 'Flexkosten', value: t.flexkostenGesamt },
    { name: 'Altersvorsorge', value: t.altersvorsorgeGesamt },
    { name: 'Sparen', value: t.sparenGesamt },
    { name: 'Investieren', value: t.investierenGesamt },
    { name: 'Nicht allokiert', value: Math.max(t.nichtAllokiert, 0) },
  ].map(d => ({ ...d, color: STRUKTUR_COLORS[d.name] })).filter(d => d.value > 0);

  const fcfUsage = [
    { name: 'Altersvorsorge', value: t.altersvorsorgeGesamt },
    { name: 'Sparen', value: t.sparenGesamt },
    { name: 'Investieren', value: t.investierenGesamt },
    { name: 'Nicht allokiert', value: t.nichtAllokiert },
  ].map(d => ({ ...d, color: STRUKTUR_COLORS[d.name] }));

  const fixSorted = [...budget.fixkosten].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  const groessterFixposten = fixSorted[0];
  const history = [...(budget.history || [])].sort((a, b) => a.month.localeCompare(b.month)).map(h => ({ ...h, label: monthLabel(h.month) }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      <Card title="VOM EINKOMMEN ZUM FREE CASH FLOW" className="md:col-span-2">
        <IncomeFlowDiagram einnahmen={t.einnahmenGesamt} fixkosten={t.fixkostenGesamt} flexkosten={t.flexkostenGesamt} fcf={t.fcf} />
      </Card>

      <Card title="STRUKTUR DER EINNAHMEN">
        {strukturData.length === 0 ? <EmptyState text="Noch keine Daten." /> : (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={strukturData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={75} paddingAngle={2} isAnimationActive={false}>
                  {strukturData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtEURDetailed(v)} />
              </PieChart>
            </ResponsiveContainer>
            {strukturData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm py-1">
                <span className="flex items-center gap-2"><Dot color={d.color} />{d.name}</span>
                <span className="tabular-nums" style={{ color: COLORS.textMuted }}>{t.einnahmenGesamt > 0 ? fmtPct(d.value / t.einnahmenGesamt) : '–'}</span>
              </div>
            ))}
          </>
        )}
      </Card>

      <Card title="VERWENDUNG DES FREE CASH FLOW">
        <table className="w-full text-sm">
          <tbody>
            {fcfUsage.map(d => (
              <tr key={d.name} className="border-b" style={{ borderColor: COLORS.border }}>
                <td className="py-2 pr-2"><span className="inline-flex items-center gap-2"><Dot color={d.color} />{d.name}</span></td>
                <td className="py-2 text-right font-medium tabular-nums" style={{ color: d.color }}>{fmtEUR(d.value)}</td>
                <td className="py-2 text-right tabular-nums" style={{ color: COLORS.textMuted }}>{t.fcf !== 0 ? fmtPct(d.value / t.fcf) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="FIXKOSTEN NACH GEWICHT">
        <table className="w-full text-sm">
          <tbody>
            {fixSorted.map(it => (
              <tr key={it.id} className="border-b" style={{ borderColor: COLORS.border }}>
                <td className="py-2 pr-2">{it.name}</td>
                <td className="py-2 text-right tabular-nums">{fmtEUR(it.amount)}</td>
                <td className="py-2 text-right tabular-nums" style={{ color: COLORS.textMuted }}>{t.einnahmenGesamt > 0 ? fmtPct((Number(it.amount) || 0) / t.einnahmenGesamt) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="BEWERTUNG">
        <ul className="text-sm space-y-2 list-disc pl-4">
          <li>Sparquote {fmtPct(t.sparquote)} – {t.sparquote >= 0.3 ? 'deutlich über der Zielmarke von 20 %' : t.sparquote >= 0.2 ? 'über der Zielmarke von 20 %' : 'unter der Zielmarke von 20 % – Allokation prüfen'}</li>
          <li>Fixkostenquote {fmtPct(t.fixkostenquote)} – {t.fixkostenquote < 0.4 ? 'im grünen Bereich (Ziel < 50 %)' : t.fixkostenquote <= 0.5 ? 'im Blick behalten (Ziel < 50 %)' : 'über der Zielmarke von 50 % – Fixkosten prüfen'}</li>
          <li>
            {t.nichtAllokiert < 0
              ? `Allokation übersteigt den Free Cash Flow um ${fmtEUR(Math.abs(t.nichtAllokiert))} – Positionen anpassen`
              : `Puffer ${fmtEUR(t.nichtAllokiert)}${t.fcf > 0 ? ` (${fmtPct(t.nichtAllokiert / t.fcf)} des FCF)` : ''} – ${t.fcf > 0 && t.nichtAllokiert / t.fcf < 0.05 ? 'sehr knapp, Reserve prüfen' : 'ausreichend Spielraum'}`}
          </li>
          {groessterFixposten && t.einnahmenGesamt > 0 && (
            <li>Größter Fixposten: {groessterFixposten.name} mit {fmtPct((Number(groessterFixposten.amount) || 0) / t.einnahmenGesamt)} der Einnahmen</li>
          )}
        </ul>
      </Card>

      {history.length > 0 && (
        <Card title="VERLAUF (GESPEICHERTE MONATE)" className="md:col-span-2 xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1" style={{ color: COLORS.textMuted }}>Free Cash Flow</div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v) => fmtEURDetailed(v)} />
                  <Line type="monotone" dataKey="fcf" name="FCF" stroke={COLORS.income} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: COLORS.textMuted }}>Sparquote</div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v) => fmtPct(v)} />
                  <Line type="monotone" dataKey="sparquote" name="Sparquote" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default {
  id: 'auswertung',
  label: 'Auswertung',
  icon: PieIcon,
  order: 20,
  Component: Auswertung,
};
