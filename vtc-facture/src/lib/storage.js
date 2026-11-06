import { DEFAULT_TARIFS } from "./pricing.js";

const K = { settings: "vtc.settings", courses: "vtc.courses", counters: "vtc.counters" };

export const DEFAULT_SETTINGS = {
  entreprise: {
    // Ce que voit le client
    marque: "Groupe HOLAMM",
    chauffeur: "Jean-Christophe Lanzo",
    statutChauffeur: "Chauffeur VTC — entrepreneur-salarié",
    // Émetteur légal de la facture (coopérative)
    nom: "Stairling Union",
    forme: "SCIC SAS à capital variable — capital 6 004 €",
    adresse: "5 rue Pleyel\n93200 Saint-Denis",
    siret: "928 978 279 00018",
    rcs: "928 978 279 R.C.S. Bobigny",
    tvaIntra: "FR10928978279",
    evtc: "",
    telephone: "",
    email: "",
    iban: "",
    logo: "", // data URL
  },
  tarifs: DEFAULT_TARIFS,
  googleMapsKey: "",
  anthropicKey: "",
  validiteDevisJours: 30,
};

function read(k, fallback) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function write(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error("Stockage impossible", e);
  }
}

export function loadSettings() {
  const s = read(K.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    entreprise: { ...DEFAULT_SETTINGS.entreprise, ...(s.entreprise || {}) },
    tarifs: {
      ...DEFAULT_TARIFS,
      ...(s.tarifs || {}),
      supplements: { ...DEFAULT_TARIFS.supplements, ...(s.tarifs?.supplements || {}) },
    },
  };
}
export const saveSettings = (s) => write(K.settings, s);

export const loadCourses = () => read(K.courses, []);
export const saveCourses = (c) => write(K.courses, c);

/** Numéro suivant, séquentiel par année et par type, jamais réutilisé. */
export function nextNumber(type /* "D" | "F" */, date = new Date()) {
  const counters = read(K.counters, {});
  const y = date.getFullYear();
  const id = `${type}-${y}`;
  counters[id] = (counters[id] || 0) + 1;
  write(K.counters, counters);
  return `${type}-${y}-${String(counters[id]).padStart(4, "0")}`;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ── Enregistrements audio (IndexedDB) ────────────────────────────────────────
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vtc-audio", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("audio");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveAudio(id, blob) {
  try {
    const d = await db();
    await new Promise((res, rej) => {
      const tx = d.transaction("audio", "readwrite");
      tx.objectStore("audio").put(blob, id);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {
    console.error("Audio non enregistré", e);
  }
}
export async function loadAudio(id) {
  try {
    const d = await db();
    return await new Promise((res, rej) => {
      const r = d.transaction("audio").objectStore("audio").get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  } catch {
    return null;
  }
}
