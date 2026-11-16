// Platzhalter für den Service-Worker-Anschluss im Mac-Build (siehe vite.config.js).
// Die Mac-App braucht keinen Service Worker; UpdateBanner nutzt dort useDesktopUpdate.
export function useRegisterSW() {
  return { needRefresh: [false, () => {}], offlineReady: [false, () => {}], updateServiceWorker: async () => {} };
}
