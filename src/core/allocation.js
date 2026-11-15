// Soll/Ist-Allokation und Rebalancing je Kategorie.

export function allocationRows(investments, targets = {}) {
  const total = investments.reduce((a, p) => a + (Number(p.value) || 0), 0);
  const byCat = {};
  investments.forEach(p => {
    const cat = p.category || 'Sonstiges';
    byCat[cat] = (byCat[cat] || 0) + (Number(p.value) || 0);
  });
  const names = Array.from(new Set([...Object.keys(byCat), ...Object.keys(targets).filter(k => Number(targets[k]) > 0)]));
  const sollSum = names.reduce((a, n) => a + (Number(targets[n]) || 0), 0);
  const hasTargets = sollSum > 0;

  const rows = names.map(name => {
    const value = byCat[name] || 0;
    const ist = total > 0 ? value / total : 0;
    const soll = (Number(targets[name]) || 0) / 100;
    return {
      name, value, ist, soll,
      diff: hasTargets ? ist - soll : null,
      // positiv = nachkaufen, negativ = reduzieren
      rebalance: hasTargets ? soll * total - value : null,
    };
  }).sort((a, b) => b.value - a.value);

  // Wie viel frisches Geld nötig ist, um die Zielgewichte ganz ohne Verkäufe zu erreichen
  let contributionOnly = null;
  if (hasTargets && Math.abs(sollSum - 100) < 0.01 && total > 0) {
    if (rows.some(r => r.value > 0 && r.soll === 0)) contributionOnly = Infinity;
    else contributionOnly = Math.max(...rows.filter(r => r.soll > 0).map(r => r.value / r.soll)) - total;
  }

  return { rows, total, sollSum, hasTargets, contributionOnly };
}
