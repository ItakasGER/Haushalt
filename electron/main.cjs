// Mac-Hülle (Electron) für dieselbe App, die auf dem iPad als PWA läuft.
// Die Oberfläche kommt unverändert aus dist/ (gebaut mit `npm run build:desktop`).
// Hier steht nur, was ein Mac-Programm zusätzlich braucht: Fenster, Menü, Dateizugriff.

const { app, BrowserWindow, Menu, net, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DIST = path.join(__dirname, '..', 'dist');
// Eigenes Schema statt file:// – dadurch hat der lokale Speicher (localStorage)
// eine feste Herkunft und bleibt über Updates und Umzüge der App erhalten.
const APP_URL = 'app://haushalt/index.html';
const RELEASES_HOST = 'github.com';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

let mainWindow = null;

// ---- Fenstergröße merken ----
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (Number.isFinite(s.width) && Number.isFinite(s.height)) return s;
  } catch (e) { /* erster Start */ }
  return { width: 1280, height: 860 };
}

function saveWindowState(win) {
  try {
    if (win.isMinimized() || win.isFullScreen()) return;
    fs.writeFileSync(stateFile(), JSON.stringify(win.getBounds()));
  } catch (e) { /* nicht kritisch */ }
}

// ---- Fenster ----
function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    ...state,
    minWidth: 760,
    minHeight: 560,
    title: 'Haushaltsrechnung & Investments',
    backgroundColor: '#F4F5FA',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', () => saveWindowState(mainWindow));
  mainWindow.on('closed', () => { mainWindow = null; });

  // Externe Links (z. B. „Neue Version laden“) im Browser öffnen, nie in der App
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://haushalt/')) {
      event.preventDefault();
      openExternalSafely(url);
    }
  });

  mainWindow.loadURL(APP_URL);
}

function openExternalSafely(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && (u.hostname === RELEASES_HOST || u.hostname.endsWith('.github.io'))) shell.openExternal(u.toString());
  } catch (e) { /* ungültige URL ignorieren */ }
}

// ---- Menü (deutsch) ----
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: `Über ${app.name}` },
        { type: 'separator' },
        { role: 'hide', label: `${app.name} ausblenden` },
        { role: 'hideOthers', label: 'Andere ausblenden' },
        { role: 'unhide', label: 'Alle einblenden' },
        { type: 'separator' },
        { role: 'quit', label: `${app.name} beenden` },
      ],
    }] : []),
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo', label: 'Widerrufen' },
        { role: 'redo', label: 'Wiederholen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einsetzen' },
        { role: 'selectAll', label: 'Alles auswählen' },
      ],
    },
    {
      label: 'Darstellung',
      submenu: [
        { role: 'reload', label: 'Neu laden' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Originalgröße' },
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Vollbild' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Entwicklertools' },
      ],
    },
    {
      label: 'Fenster',
      submenu: [
        { role: 'minimize', label: 'Im Dock ablegen' },
        { role: 'zoom', label: 'Zoomen' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front', label: 'Alle nach vorne bringen' }] : [{ role: 'close', label: 'Schließen' }]),
      ],
    },
    {
      label: 'Hilfe',
      submenu: [
        { label: 'Neueste Version laden …', click: () => shell.openExternal('https://github.com/ItakasGER/Haushalt/releases/latest') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- Start ----
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    // app://haushalt/<pfad> → Datei aus dist/, nichts außerhalb davon
    protocol.handle('app', (request) => {
      const { hostname, pathname } = new URL(request.url);
      if (hostname !== 'haushalt') return new Response('Not found', { status: 404 });
      const file = path.normalize(path.join(DIST, decodeURIComponent(pathname === '/' ? '/index.html' : pathname)));
      if (file !== DIST && !file.startsWith(DIST + path.sep)) return new Response('Forbidden', { status: 403 });
      return net.fetch(pathToFileURL(file).toString());
    });

    buildMenu();
    createWindow();
    app.on('activate', () => { if (!mainWindow) createWindow(); });
  });

  app.on('window-all-closed', () => app.quit());
}
