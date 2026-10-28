# Erweitern & Patchen

Die App ist modular aufgebaut. Jeder Bereich in der Navigation ist ein **Modul**
in einem eigenen Ordner. Um eine neue Anwendung einzubauen, legst du einen Ordner an;
am bestehenden Code änderst du dafür nichts.

## Projektaufbau

```
src/
├─ main.jsx               Einstieg
├─ App.jsx                Gerüst: Kopfzeile, Planauswahl, Kennzahlen, Navigation
├─ core/                  Logik ohne UI – von allen Modulen nutzbar
│  ├─ PlanContext.jsx     Zustand + Aktionen (usePlan, useModuleData)
│  ├─ registry.js         findet Module automatisch
│  ├─ finance.js          Kennzahlen, Zinseszins (futureValue), Verknüpfungen
│  ├─ format.js           €/%-Formatierung, deutsche Zahleneingabe
│  ├─ theme.js            Farben
│  ├─ storage.js          lokaler Speicher (Präfix "findash:", wie Mac)
│  ├─ backup.js           Export/Import
│  ├─ migrations.js       Datenmigrationen bei Formatänderungen
│  └─ defaults.js         Startwerte
├─ ui/                    wiederverwendbare Bausteine (Card, NumberField, Button …)
└─ modules/
   ├─ erfassung/          order 10
   ├─ auswertung/         order 20
   ├─ investments/        order 30
   ├─ forecast/           order 40
   ├─ daten/              order 90
   └─ _vorlage/           Vorlage (wird ignoriert, weil "_")
```

## Neues Modul in 3 Schritten

1. `src/modules/_vorlage` kopieren, z. B. nach `src/modules/sparziele`
2. In `index.jsx` unten `id`, `label`, `icon` und `order` anpassen
3. `npm run dev`: Das Modul erscheint automatisch in Seitenleiste und Tab-Leiste

Jedes Modul exportiert ein Objekt:

```js
export default {
  id: 'sparziele',        // eindeutig; zugleich Speicher-Schlüssel
  label: 'Sparziele',     // Name in der Navigation
  icon: Target,           // Icon aus lucide-react (https://lucide.dev/icons)
  order: 50,              // Position (Daten = 90 bleibt am Ende)
  showSummary: true,      // Kennzahlen-Kacheln oben anzeigen (Standard: ja)
  enabled: true,          // false = ausblenden, ohne zu löschen
  Component: Sparziele,
};
```

Auf dem iPad passen im Hochformat etwa 6–7 Module bequem in die Tab-Leiste, im
Querformat beliebig viele in die Seitenleiste.

## Daten im Modul

```js
import { usePlan, useModuleData } from '../../core/PlanContext.jsx';

// Daten des aktiven Plans lesen und ändern
const { budget, investments, totals, activePlan, updateItem, addPosition, ... } = usePlan();

// Eigener Speicher fürs Modul – pro Plan getrennt, automatisch im Backup,
// wird beim Löschen des Plans mit entfernt
const [ziele, setZiele] = useModuleData('sparziele', []);
setZiele(prev => [...prev, { id: uid(), name: 'Auto', betrag: 15000 }]);
```

Wichtige Werte in `totals`: `einnahmenGesamt`, `fixkostenGesamt`, `flexkostenGesamt`,
`fcf`, `altersvorsorgeGesamt`, `sparenGesamt`, `investierenGesamt`, `allokationGesamt`,
`nichtAllokiert`, `sparquote`, `fixkostenquote`, `totalPortfolio`.

Für Eingaben `NumberField` aus `ui/components.jsx` verwenden. Es bringt
Ziffernblock und deutsches Komma mit und speichert beim Verlassen des Feldes.

## Speicherformat ändern

Bestehende Schlüssel nie stillschweigend umbauen. Stattdessen in
`core/migrations.js` eine Migration mit der nächsten Versionsnummer anhängen. Sie
läuft auf jedem Gerät genau einmal, beim Import alter Backups ebenfalls.

## Update ausrollen (Patch)

1. Änderung machen und mit `npm run dev` testen
2. `version` in `package.json` erhöhen (z. B. 2.0.0 → 2.1.0) und `CHANGELOG.md` ergänzen
3. Commit und Push auf `main`. GitHub baut und veröffentlicht automatisch (ca. 1–2 Min.,
   Status unter *Actions* im Repository)
4. Auf dem iPad erscheint beim nächsten Öffnen **„Eine neue Version ist verfügbar“**,
   dann auf *Jetzt aktualisieren* tippen. Die Daten bleiben erhalten.

## Patches mit Claude

Am einfachsten gibst du Claude den Projektordner (oder das ZIP) und beschreibst das
gewünschte Modul, z. B. *„Baue ein Modul ‚Sparziele‘ nach PATCHING.md“*. Weil jedes
Modul in sich abgeschlossen ist, bleiben die bestehenden Bereiche unangetastet.
