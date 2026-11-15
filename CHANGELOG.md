# Changelog

## 2.1.0 – Depot-Analyse
- Investments: Einstandswert je Titel, Gewinn/Verlust in € und %, sortierbare Tabelle
- „Depotstand speichern“ mit Monatsauswahl; „Monat speichern“ sichert den Depotstand mit
- Neuer Bereich „Depot-Analyse“: Wertentwicklung, Monatsstände (auch nachtragbar),
  zeitgewichtete Rendite (Modified Dietz), Soll/Ist-Allokation mit Rebalancing,
  größte Positionen, Gewinn/Verlust je Titel
- Forecast: Horizont 5/10/20/30 Jahre, inflationsbereinigte Werte, Zielvermögen
- Fix: Eingaben wie „2.100“ werden als 2100 gelesen (Punkt als Tausendertrenner)

## 2.0.0 – iPad-Version
- Portierung der Mac-Version (Stand 13.09.2026) als installierbare iPad-App (PWA)
- Touch-Bedienung: große Tippflächen, Ziffernblock mit deutschem Komma, kein Zoom bei Eingaben
- Navigation: Seitenleiste im Querformat, Tab-Leiste im Hochformat
- Modulsystem: neue Bereiche als Ordner unter `src/modules/` (siehe PATCHING.md)
- Neu: Bereich „Daten“ mit Backup-Export/-Import und Datenübernahme vom Mac
- Offline-fähig, automatischer Update-Hinweis bei neuen Versionen
- Datenformat kompatibel zur Mac-Version (Schlüssel `findash:*`)
