# Haushaltsrechnung & Investments – iPad-Version

iPad-Version deiner Mac-App „Haushaltsrechnung & Investments“. Gleiche Funktionen
(Erfassung, Auswertung, Investments, Forecast, mehrere Haushaltspläne), aber für
Touch und iPadOS umgebaut. Neu: der Bereich **Daten** für Backup und Import.

Technisch ist das eine **Progressive Web App (PWA)**: Du installierst sie über Safari
auf dem Home-Bildschirm. Danach startet sie im Vollbild wie eine native App, läuft
offline und meldet Updates selbst. Ein Apple-Developer-Account, Xcode oder der
App Store sind dafür nicht nötig.

---

## 1. Online-Adresse

Die App liegt auf GitHub Pages und wird bei jedem Push auf `main` automatisch neu
gebaut und veröffentlicht (`.github/workflows/deploy.yml`):

**https://itakasger.github.io/haushalt/**

Die Adresse ist öffentlich, enthält aber **keine** Finanzdaten. Die liegen
ausschließlich lokal auf dem iPad.

## 2. Auf dem iPad installieren

1. URL in **Safari** öffnen
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → Hinzufügen
3. Die App ab jetzt nur noch über das Icon „Haushalt“ starten

Nur die installierte App bekommt dauerhaften Speicher. Ein Safari-Tab kann von
iPadOS nach längerer Nichtnutzung geleert werden.

## 3. Daten vom Mac übernehmen

1. Mac-App öffnen und mit **⌥⌘I** die Entwicklertools öffnen, dann den Tab **Console**
2. Diesen Befehl einfügen und Enter drücken. Er kopiert alle Pläne in die Zwischenablage:

   ```js
   copy(JSON.stringify({format:'haushalt-backup',exportedAt:new Date().toISOString(),entries:Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('findash:')).map(k=>[k.slice(8),localStorage.getItem(k)]))}))
   ```
3. Auf dem iPad: Bereich **Daten → Aus Zwischenablage**, ins Feld tippen und
   *Einsetzen* (Universelle Zwischenablage, gleiche Apple-ID). Danach
   **Einfügen prüfen** und **Ersetzen**

Alternativ den Inhalt in TextEdit als `backup.json` speichern (Format → In reinen
Text umwandeln), per AirDrop aufs iPad schicken und unter **Daten → Datei auswählen**
laden.

## 4. Datensicherung

Es gibt keinen Cloud-Sync, die Daten liegen nur auf dem iPad. Deshalb ab und zu unter
**Daten → Backup exportieren** sichern (z. B. in iCloud Drive). Das Backup-Format
ist mit der Mac-Version kompatibel.

---

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173 – mit --host auch im WLAN vom iPad erreichbar
npm run build      # erzeugt dist/
npm run preview    # testet den Build lokal
```

Projektaufbau, Modulsystem und Ablauf eines Updates: siehe **[PATCHING.md](PATCHING.md)**.

## Optional: echte native iOS-App

Derselbe Code lässt sich später mit [Capacitor](https://capacitorjs.com/) in eine
native iOS-Hülle packen (`npx cap add ios`, dann in Xcode bauen). Dafür brauchst
du Xcode auf dem Mac und für dauerhafte Installation einen Apple-Developer-Account
(99 €/Jahr). Ohne Account laufen selbst signierte Apps nur 7 Tage. Für den
Eigengebrauch ist die PWA deshalb die praktischere Lösung.
