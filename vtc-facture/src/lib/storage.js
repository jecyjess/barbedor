import { DEFAULT_TARIFS } from "./pricing.js";
import { IS_SC } from "./edition.js";

// Chaque édition a ses propres données (même si elles sont ouvertes sur le même téléphone).
const P = IS_SC ? "vtc-sc" : "vtc";
const K = { settings: `${P}.settings`, courses: `${P}.courses`, counters: `${P}.counters` };

const ENTREPRISE_VIDE = {
  marque: "", prefixe: "", chauffeur: "", statutChauffeur: "Chauffeur VTC",
  nom: "", forme: "", adresse: "", siret: "", rcs: "", tvaIntra: "",
  evtc: "", carteVtc: "", telephone: "", email: "", iban: "", logo: "",
};

const ENTREPRISE_HOLAM = {
    // Ce que voit le client
    marque: "HOLAM",
    prefixe: "HOLAM", // dans les numéros : F-HOLAM-2026-11-001
    chauffeur: "Jean-Christophe Lanzo",
    statutChauffeur: "Chauffeur VTC — entrepreneur-salarié",
    // Émetteur légal de la facture (coopérative)
    nom: "Stairling Union",
    forme: "SCIC SAS à capital variable — capital 6 004 €",
    adresse: "5 rue Pleyel\n93200 Saint-Denis",
    siret: "928 978 279 00018",
    rcs: "928 978 279 R.C.S. Bobigny",
    tvaIntra: "FR10928978279",
    evtc: "EVTC075240710", // n° d'inscription au registre VTC de l'exploitant (Stairling Union)
    carteVtc: "", // carte professionnelle du chauffeur — saisie dans Réglages, reste sur l'appareil
    telephone: "+33 7 67 54 04 38",
    email: "lanzojessie@gmail.com",
    iban: "",
    logo: "", // data URL
};

export const DEFAULT_SETTINGS = {
  configured: !IS_SC, // l'édition SC demande la configuration au premier lancement
  tvaFranchise: false, // true : « TVA non applicable, art. 293 B du CGI »
  // Comparaison littérale : permet de retirer l'identité HOLAM du code de l'édition SC.
  entreprise: import.meta.env.VITE_EDITION === "sc" ? ENTREPRISE_VIDE : ENTREPRISE_HOLAM,
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
  const merged = {
    ...DEFAULT_SETTINGS,
    ...s,
    entreprise: { ...DEFAULT_SETTINGS.entreprise, ...(s.entreprise || {}) },
    tarifs: {
      ...DEFAULT_TARIFS,
      ...(s.tarifs || {}),
      supplements: { ...DEFAULT_TARIFS.supplements, ...(s.tarifs?.supplements || {}) },
    },
  };
  if (IS_SC) {
    merged.anthropicKey = "";
    merged.googleMapsKey = "";
  }
  return merged;
}
export const saveSettings = (s) => write(K.settings, IS_SC ? { ...s, anthropicKey: "", googleMapsKey: "" } : s);

export const loadCourses = () => read(K.courses, []);
export const saveCourses = (c) => write(K.courses, c);

/**
 * Numéro suivant : D-HOLAM-2026-11-001 (devis) ou F-HOLAM-2026-11-001 (facture).
 * Compteur séquentiel par type et par année (le mois est indicatif), jamais réutilisé.
 */
export function nextNumber(type /* "D" | "F" */, prefixe = "", date = new Date()) {
  const counters = read(K.counters, {});
  const y = date.getFullYear();
  const id = `${type}-${y}`;
  counters[id] = (counters[id] || 0) + 1;
  write(K.counters, counters);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const pre = prefixe ? `${prefixe.trim().toUpperCase().replace(/\s+/g, "")}-` : "";
  return `${type}-${pre}${y}-${mm}-${String(counters[id]).padStart(3, "0")}`;
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
