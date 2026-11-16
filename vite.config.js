import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Legt version.json neben die App. Die Mac-App fragt diese Datei auf GitHub Pages
// ab und erkennt so, dass eine neuere Version veröffentlicht wurde.
const versionFile = () => ({
  name: 'haushalt-version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: pkg.version }) });
  },
});

// `vite build --mode desktop` baut dieselbe App für die Mac-Hülle (electron/):
// ohne Service Worker, weil die Dateien dort ohnehin lokal in der App liegen.
export default defineConfig(({ mode }) => {
  const desktop = mode === 'desktop';
  return {
    // Relative Pfade: läuft auf jedem Hoster und in jedem Unterordner (Netlify, GitHub Pages, …)
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __DESKTOP__: JSON.stringify(desktop),
    },
    resolve: {
      alias: desktop
        ? { 'virtual:pwa-register/react': fileURLToPath(new URL('./src/desktop/pwa-stub.js', import.meta.url)) }
        : {},
    },
    build: { chunkSizeWarningLimit: 1000 },
    plugins: [
      react(),
      versionFile(),
      !desktop && VitePWA({
        // 'prompt': Neue Versionen werden erkannt und per Banner angeboten (siehe src/ui/UpdateBanner.jsx)
        registerType: 'prompt',
        includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.png'],
        manifest: {
          name: 'Haushaltsrechnung & Investments',
          short_name: 'Haushalt',
          description: 'Persönliche Finanzplanung – Budget, Investments, Forecast',
          lang: 'de',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          background_color: '#F4F5FA',
          theme_color: '#0018A8',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
  };
});
