// Modul-Registry: Jeder Ordner unter src/modules/ mit einer index.jsx wird
// automatisch als Bereich (Tab) eingebunden – kein Eintrag hier nötig.
// Ordner, die mit "_" beginnen (z. B. _vorlage), werden ignoriert.

const found = import.meta.glob(['../modules/*/index.jsx', '!../modules/_*/index.jsx'], { eager: true });

export const modules = Object.entries(found)
  .map(([path, mod]) => {
    const m = mod.default;
    if (!m || !m.id || !m.Component) {
      console.warn(`Modul ${path} exportiert kein gültiges Objekt { id, label, icon, Component }`);
      return null;
    }
    return { order: 100, enabled: true, ...m };
  })
  .filter(m => m && m.enabled)
  .sort((a, b) => a.order - b.order);
