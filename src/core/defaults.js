// Neutrale Beispielwerte für den allerersten Start – eigene Daten per Import (Bereich „Daten“)
export const DEFAULT_BUDGET = {
  einnahmen: [
    { id: 'e1', name: 'Netto-Gehalt / Lohn', amount: 2500 },
    { id: 'e2', name: 'Sonstige Einnahmen', amount: 0 },
  ],
  fixkosten: [
    { id: 'f1', name: 'Miete / Hypothek', amount: 800 },
    { id: 'f2', name: 'Internet & Telefon', amount: 40 },
    { id: 'f3', name: 'Versicherungen', amount: 30 },
    { id: 'f4', name: 'Abonnements & Streaming', amount: 20 },
    { id: 'f5', name: 'Mobilität', amount: 60 },
  ],
  flexkosten: [
    { id: 'x1', name: 'Lebensmittel & Haushalt', amount: 400 },
    { id: 'x2', name: 'Restaurant & Freizeit', amount: 0 },
    { id: 'x3', name: 'Kleidung', amount: 0 },
    { id: 'x4', name: 'Gesundheit & Drogerie', amount: 0 },
    { id: 'x5', name: 'Sonstiges', amount: 0 },
  ],
  altersvorsorge: [
    { id: 'a1', name: 'Altersvorsorgedepot', amount: 100, rendite: 5, verbrauch: 0 },
  ],
  sparen: [
    { id: 's1', name: 'Tagesgeld', amount: 200, rendite: 2, verbrauch: 0 },
  ],
  investieren: [
    { id: 'i1', name: 'ETF / Aktien-Sparplan', amount: 200, rendite: 6, verbrauch: 0 },
  ],
  history: [],
};

export const BLANK_BUDGET = {
  einnahmen: [], fixkosten: [], flexkosten: [], altersvorsorge: [], sparen: [], investieren: [], history: [],
};
