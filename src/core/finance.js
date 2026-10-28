// Reine Rechenlogik ohne UI – von allen Modulen nutzbar.

export const sumGroup = (items) => (items || []).reduce((a, it) => a + (Number(it.amount) || 0), 0);

export const LINK_GROUP_LABELS = { altersvorsorge: 'Altersvorsorge', sparen: 'Sparen', investieren: 'Investieren' };

export const getLinkTargets = (budget) => {
  const targets = [];
  Object.keys(LINK_GROUP_LABELS).forEach(g => {
    (budget[g] || []).forEach(it => targets.push({ id: it.id, group: g, name: it.name, label: `${LINK_GROUP_LABELS[g]} → ${it.name}` }));
  });
  return targets;
};

export function computeTotals(budget, investments) {
  const einnahmenGesamt = sumGroup(budget.einnahmen);
  const fixkostenGesamt = sumGroup(budget.fixkosten);
  const flexkostenGesamt = sumGroup(budget.flexkosten);
  const fcf = einnahmenGesamt - fixkostenGesamt - flexkostenGesamt;
  const altersvorsorgeGesamt = sumGroup(budget.altersvorsorge);
  const sparenGesamt = sumGroup(budget.sparen);
  const investierenGesamt = sumGroup(budget.investieren);
  const allokationGesamt = altersvorsorgeGesamt + sparenGesamt + investierenGesamt;
  const nichtAllokiert = fcf - allokationGesamt;
  const sparquote = einnahmenGesamt > 0 ? allokationGesamt / einnahmenGesamt : 0;
  const fixkostenquote = einnahmenGesamt > 0 ? fixkostenGesamt / einnahmenGesamt : 0;
  const totalPortfolio = (investments || []).reduce((a, p) => a + (Number(p.value) || 0), 0);
  return {
    einnahmenGesamt, fixkostenGesamt, flexkostenGesamt, fcf, altersvorsorgeGesamt, sparenGesamt,
    investierenGesamt, allokationGesamt, nichtAllokiert, sparquote, fixkostenquote, totalPortfolio,
  };
}

// Zinseszins mit monatlicher Sparrate und optionalem jährlichem Verbrauchsfaktor
// (z. B. Tagesgeld, das für größere Anschaffungen genutzt wird)
export const futureValue = (pv, monthlyContribution, annualRatePct, consumptionPct, years) => {
  const r = (Number(annualRatePct) || 0) / 100;
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;
  const c = Math.max(Number(consumptionPct) || 0, 0) / 100;
  let balance = Number(pv) || 0;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) balance = balance * (1 + monthlyRate) + (Number(monthlyContribution) || 0);
    balance = balance * (1 - c);
  }
  return Math.max(balance, 0);
};
