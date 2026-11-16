// Sauvegarde complète (réglages sans les clés, courses avec signatures, compteurs de numéros).
import { APP_NAME, EDITION } from "./edition.js";
import { loadCounters, loadCourses, loadSettings, saveCounters, saveCourses, saveSettings } from "./storage.js";

export function buildBackup() {
  const { anthropicKey, googleMapsKey, ...settings } = loadSettings(); // les clés ne quittent jamais le téléphone
  return {
    app: APP_NAME,
    edition: EDITION,
    version: 1,
    date: new Date().toISOString(),
    settings,
    courses: loadCourses(),
    counters: loadCounters(),
  };
}

export function isBackup(o) {
  return o && o.version === 1 && Array.isArray(o.courses) && o.settings && typeof o.counters === "object";
}

/** Restaure une sauvegarde ; garde les clés et le choix de sauvegarde de ce téléphone. */
export function restoreBackup(o) {
  if (!isBackup(o)) throw new Error("Ce fichier n'est pas une sauvegarde VTC Facture.");
  const current = loadSettings();
  saveSettings({
    ...o.settings,
    anthropicKey: current.anthropicKey,
    googleMapsKey: current.googleMapsKey,
    backup: current.backup,
    configured: true,
  });
  saveCourses(o.courses);
  // Les compteurs ne reculent jamais : un numéro de facture ne doit pas être réutilisé.
  const c = loadCounters();
  const merged = { ...c };
  for (const [k, v] of Object.entries(o.counters || {})) merged[k] = Math.max(v, c[k] || 0);
  saveCounters(merged);
  return { courses: o.courses.length, date: o.date };
}

export function downloadBackup() {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vtc-facture-sauvegarde-${data.date.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return data;
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try { resolve(JSON.parse(r.result)); } catch { reject(new Error("Fichier illisible.")); }
    };
    r.onerror = () => reject(new Error("Fichier illisible."));
    r.readAsText(file);
  });
}
