# Haushaltsrechnung & Investments – iPad und Mac

Ein Code, zwei Apps mit identischem Funktionsstand (Erfassung, Auswertung, Investments,
Depot-Analyse, Forecast, mehrere Haushaltspläne, Daten):

- **iPad:** Progressive Web App (PWA). Du installierst sie über Safari auf dem
  Home-Bildschirm; sie läuft danach im Vollbild, offline und meldet Updates selbst.
- **Mac:** eigenständige App (`Haushalt.app`), gebaut aus denselben Quelltexten.
  Jede neue Version erscheint automatisch als Download unter
  [Releases](https://github.com/ItakasGER/Haushalt/releases/latest).

Ein Apple-Developer-Account, Xcode oder der App Store sind für beides nicht nötig.

---

## 1. Online-Adresse

Die App liegt auf GitHub Pages und wird bei jedem Push auf `main` automatisch neu
gebaut und veröffentlicht (`.github/workflows/deploy.yml`):

**https://itakasger.github.io/Haushalt/**

Die Adresse ist öffentlich, enthält aber **keine** Finanzdaten. Die liegen
ausschließlich lokal auf dem iPad.

## 2. Auf dem iPad installieren

1. URL in **Safari** öffnen
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → Hinzufügen
3. Die App ab jetzt nur noch über das Icon „Haushalt“ starten

Nur die installierte App bekommt dauerhaften Speicher. Ein Safari-Tab kann von
iPadOS nach längerer Nichtnutzung geleert werden.

## 3. Mac-App installieren

1. Unter [Releases](https://github.com/ItakasGER/Haushalt/releases/latest) die
   passende Datei laden: `…-mac-arm64.dmg` für Apple Silicon (M1 und neuer),
   `…-mac-x64.dmg` für Intel-Macs
2. `.dmg` öffnen und **Haushalt** in den Ordner *Programme* ziehen
3. Erster Start: Die App ist nicht bei Apple notarisiert (dafür wäre ein
   Developer-Account nötig), macOS blockiert sie deshalb einmalig. Entweder unter
   **Systemeinstellungen → Datenschutz & Sicherheit** auf **„Dennoch öffnen“** klicken
   oder einmal im Terminal ausführen:

   ```bash
   xattr -dr com.apple.quarantine /Applications/Haushalt.app
   ```

Updates: Sobald eine neuere Version veröffentlicht ist, zeigt die App oben
**„Version … ist verfügbar“**. Neue `.dmg` laden und die App in *Programme* ersetzen;
die Daten liegen getrennt davon und bleiben erhalten.

Die neue App heißt **Haushalt** und speichert ihre Daten unabhängig von der
bisherigen Mac-App. Die alte App bleibt also unangetastet, bis du sie löschst.

## 4. Daten übernehmen

**Von der bisherigen Mac-App in die neue Mac-App oder aufs iPad**

1. Alte Mac-App öffnen und mit **⌥⌘I** die Entwicklertools öffnen, dann den Tab **Console**
2. Diesen Befehl einfügen und Enter drücken. Er kopiert alle Pläne in die Zwischenablage:

   ```js
   copy(JSON.stringify({format:'haushalt-backup',exportedAt:new Date().toISOString(),entries:Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('findash:')).map(k=>[k.slice(8),localStorage.getItem(k)]))}))
   ```
3. In der Ziel-App: Bereich **Daten → Aus Zwischenablage**, einfügen (am iPad über die
   Universelle Zwischenablage, gleiche Apple-ID), dann **Einfügen prüfen** und **Ersetzen**

**Zwischen iPad und Mac**

Auf dem Gerät mit dem aktuellen Stand **Daten → Backup exportieren**, die Datei per
AirDrop oder iCloud Drive aufs andere Gerät bringen und dort unter
**Daten → Datei auswählen** einspielen. Es gibt keinen automatischen Abgleich: Der
Import ersetzt jeweils den kompletten Datenbestand des Zielgeräts.

## 5. Datensicherung

Es gibt keinen Cloud-Sync, die Daten liegen nur lokal auf dem jeweiligen Gerät. Deshalb
ab und zu unter **Daten → Backup exportieren** sichern (z. B. in iCloud Drive). Das
Backup-Format ist auf iPad und Mac identisch.

---

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173 – mit --host auch im WLAN vom iPad erreichbar
npm run build      # erzeugt dist/
npm run preview    # testet den Build lokal

npm run desktop    # Mac-App lokal starten (Electron)
npm run dist:mac   # .dmg bauen (nur auf einem Mac), Ergebnis in release/
```

Projektaufbau, Modulsystem und Ablauf eines Updates: siehe **[PATCHING.md](PATCHING.md)**.

## Optional: echte native iOS-App

Derselbe Code lässt sich später mit [Capacitor](https://capacitorjs.com/) in eine
native iOS-Hülle packen (`npx cap add ios`, dann in Xcode bauen). Dafür brauchst
du Xcode auf dem Mac und für dauerhafte Installation einen Apple-Developer-Account
(99 €/Jahr). Ohne Account laufen selbst signierte Apps nur 7 Tage. Für den
Eigengebrauch ist die PWA deshalb die praktischere Lösung.
