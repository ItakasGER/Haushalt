// VORLAGE FÜR EIN NEUES MODUL
// 1. Ordner kopieren:   src/modules/_vorlage  →  src/modules/mein-modul
//    (Ordner mit "_" am Anfang werden ignoriert – der neue Name darf keinen haben.)
// 2. id, label, icon und order unten anpassen.
// 3. Fertig – das Modul erscheint automatisch in der Navigation.
// Details: PATCHING.md im Projektordner.

import React, { useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { COLORS } from '../../core/theme.js';
import { fmtEUR } from '../../core/format.js';
import { usePlan, useModuleData } from '../../core/PlanContext.jsx';
import { Button, Card, EmptyState, IconButton, TextField } from '../../ui/components.jsx';

function Vorlage() {
  // Zugriff auf die Daten des aktiven Haushaltsplans (nur lesen oder über Aktionen ändern)
  const { activePlan, totals } = usePlan();
  // Eigener Speicher dieses Moduls – pro Plan getrennt, automatisch im Backup enthalten
  const [notizen, setNotizen] = useModuleData('vorlage', []);
  const [text, setText] = useState('');

  const add = () => {
    if (!text.trim()) return;
    setNotizen(prev => [...prev, { id: Date.now().toString(36), text: text.trim() }]);
    setText('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card title="BEISPIEL: KENNZAHL AUS DEM PLAN">
        <div className="text-sm" style={{ color: COLORS.textMuted }}>Free Cash Flow in „{activePlan?.name}“</div>
        <div className="text-2xl font-semibold">{fmtEUR(totals.fcf)}</div>
      </Card>
      <Card title="BEISPIEL: EIGENE DATEN">
        {notizen.length === 0 && <EmptyState text="Noch keine Einträge." />}
        {notizen.map(n => (
          <div key={n.id} className="flex items-center gap-2">
            <span className="flex-1 text-[15px]">{n.text}</span>
            <IconButton label="Entfernen" onClick={() => setNotizen(prev => prev.filter(x => x.id !== n.id))}><Trash2 size={16} /></IconButton>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <TextField value={text} onChange={e => setText(e.target.value)} placeholder="Neuer Eintrag" className="flex-1" />
          <Button variant="primary" onClick={add}><Plus size={18} /></Button>
        </div>
      </Card>
    </div>
  );
}

export default {
  id: 'vorlage',          // eindeutig, nur Kleinbuchstaben/Bindestriche – wird auch als Speicher-Schlüssel genutzt
  label: 'Vorlage',       // Name in der Navigation
  icon: Sparkles,         // beliebiges Icon von https://lucide.dev/icons
  order: 50,              // Position in der Navigation (10, 20, 30 … – Daten hat 90)
  // showSummary: false,  // Kennzahlen-Kacheln oben ausblenden
  // enabled: false,      // Modul vorübergehend deaktivieren
  Component: Vorlage,
};
