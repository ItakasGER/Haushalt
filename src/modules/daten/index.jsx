// Datensicherung: Export/Import aller Pläne als JSON-Datei, Datenübernahme vom Mac.
import React, { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Database, Download, HardDrive, Upload } from 'lucide-react';
import { COLORS } from '../../core/theme.js';
import { createBackup, parseBackup, restoreBackup, shareOrDownload } from '../../core/backup.js';
import { requestPersistentStorage } from '../../core/storage.js';
import { usePlan } from '../../core/PlanContext.jsx';
import { Button, Card, ConfirmBar } from '../../ui/components.jsx';

function Daten() {
  const { plans, reloadFromStorage } = usePlan();
  const fileInput = useRef(null);
  const [pasteText, setPasteText] = useState('');
  const [pending, setPending] = useState(null); // geprüftes Backup, wartet auf Bestätigung
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [persisted, setPersisted] = useState(null);

  useEffect(() => { requestPersistentStorage().then(setPersisted); }, []);

  const exportNow = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const result = await shareOrDownload(`haushalt-backup-${stamp}.json`, JSON.stringify(createBackup(), null, 2));
    if (result !== 'aborted') setMessage({ type: 'ok', text: 'Backup erstellt.' });
  };

  const check = (text) => {
    try {
      setPending(parseBackup(text));
      setMessage(null);
    } catch (e) {
      setPending(null);
      setMessage({ type: 'error', text: e.message });
    }
  };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) check(await file.text());
  };

  const confirmImport = () => {
    restoreBackup(pending.entries);
    reloadFromStorage();
    setMessage({ type: 'ok', text: `Import abgeschlossen – ${pending.planCount === 1 ? '1 Plan' : `${pending.planCount} Pläne`} geladen.` });
    setPending(null);
    setPasteText('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {message && (
        <div className="md:col-span-2 rounded-xl px-4 py-3 text-sm text-white" style={{ backgroundColor: message.type === 'ok' ? COLORS.income : COLORS.expense }}>
          {message.text}
        </div>
      )}
      {pending && (
        <div className="md:col-span-2 rounded-xl overflow-hidden">
          <ConfirmBar confirmLabel="Ersetzen"
            text={`Backup mit ${pending.planCount === 1 ? '1 Plan' : `${pending.planCount} Plänen`}${pending.exportedAt ? ` vom ${new Date(pending.exportedAt).toLocaleString('de-DE')}` : ''} gefunden. Alle aktuellen Daten auf diesem Gerät werden ersetzt.`}
            onConfirm={confirmImport} onCancel={() => setPending(null)} />
        </div>
      )}

      <Card title="BACKUP ERSTELLEN">
        <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
          Sichert {plans.length === 1 ? 'den Haushaltsplan' : `alle ${plans.length} Haushaltspläne`} inkl. Investments und Verlauf als JSON-Datei – z. B. in „Dateien“ / iCloud Drive oder per AirDrop an den Mac.
        </p>
        <Button variant="primary" onClick={exportNow}><Download size={18} /> Backup exportieren</Button>
      </Card>

      <Card title="BACKUP EINSPIELEN">
        <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
          Lädt ein Backup vom iPad oder vom Mac. Die aktuellen Daten werden dabei ersetzt.
        </p>
        <input ref={fileInput} type="file" accept="application/json,.json,text/plain" className="hidden" onChange={onFile} />
        <Button onClick={() => fileInput.current && fileInput.current.click()}><Upload size={18} /> Datei auswählen</Button>
      </Card>

      <Card title="AUS ZWISCHENABLAGE (VOM MAC)" className="md:col-span-2">
        <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>
          Auf dem Mac den Export-Befehl aus der Anleitung (README) in der App-Konsole ausführen, dann hier einfügen – dank „Universelle Zwischenablage“ direkt vom Mac aufs iPad.
        </p>
        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={4} placeholder='{"format":"haushalt-backup", …}'
          className="w-full p-3 rounded-lg border font-mono" style={{ borderColor: COLORS.border, fontSize: 14 }} />
        <Button className="mt-2" disabled={!pasteText.trim()} onClick={() => check(pasteText)}><ClipboardPaste size={18} /> Einfügen prüfen</Button>
      </Card>

      <Card title="SPEICHER & VERSION" className="md:col-span-2">
        <div className="text-sm space-y-1.5">
          <div className="flex items-center gap-2"><HardDrive size={16} />
            Dauerhafter Speicher: {persisted === true ? 'aktiv' : persisted === false ? 'nicht bestätigt – App über „Zum Home-Bildschirm“ installieren und regelmäßig Backups erstellen' : 'unbekannt'}
          </div>
          <div style={{ color: COLORS.textMuted }}>Daten liegen nur lokal auf diesem Gerät (kein Cloud-Sync). App-Version {__APP_VERSION__}.</div>
        </div>
      </Card>
    </div>
  );
}

export default {
  id: 'daten',
  label: 'Daten',
  icon: Database,
  order: 90,
  showSummary: false,
  Component: Daten,
};
