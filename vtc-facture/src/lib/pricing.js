import { holidayName } from "./holidays.js";

// Grille par défaut — tous les montants sont TTC.
export const DEFAULT_TARIFS = {
  priseEnCharge: 5,
  prixKm: 1.5,
  prixKmPromo: 1.3,
  majorationPct: 20, // nuit, week-end, jours fériés
  nuitDebut: 21, // heure de début de nuit (incluse)
  nuitFin: 6, // heure de fin de nuit (exclue)
  minimum: 15,
  tva: 10,
  prixMinuteSup: 0.3, // minute au-delà de la durée estimée + tolérance
  toleranceMin: 5,
  supplements: { orly: 10, cdg: 5, beauvais: 15 },
};

export const AIRPORTS = {
  orly: { label: "Orly", re: /\borly\b/i },
  cdg: { label: "Roissy-CDG", re: /\b(cdg|roissy|charles[\s-]*de[\s-]*gaulle)\b/i },
  beauvais: { label: "Beauvais", re: /\b(beauvais|till[ée])\b/i },
};

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Aéroports détectés dans les adresses (chacun compté une seule fois). */
export function detectAirports(...addresses) {
  const text = addresses.filter(Boolean).join(" | ");
  return Object.keys(AIRPORTS).filter((k) => AIRPORTS[k].re.test(text));
}

/** Raison de la majoration (nuit, week-end, férié) ou null. */
export function majorationReason(date, tarifs = DEFAULT_TARIFS) {
  if (!(date instanceof Date) || isNaN(date)) return null;
  const reasons = [];
  const h = date.getHours();
  const night =
    tarifs.nuitDebut > tarifs.nuitFin
      ? h >= tarifs.nuitDebut || h < tarifs.nuitFin
      : h >= tarifs.nuitDebut && h < tarifs.nuitFin;
  if (night) reasons.push("nuit");
  const day = date.getDay();
  if (day === 0 || day === 6) reasons.push("week-end");
  const ferie = holidayName(date);
  if (ferie) reasons.push(`férié (${ferie})`);
  return reasons.length ? reasons.join(", ") : null;
}

/**
 * Calcule le prix d'une course.
 *
 * - Majoration : appliquée à la prise en charge + kilomètres, jamais aux suppléments aéroport.
 * - Minimum : appliqué sur le total de la course (hors minutes supplémentaires).
 * - Minutes supplémentaires (facture uniquement) : si la durée réelle dépasse la durée
 *   estimée de plus que la tolérance, les minutes au-delà sont PROPOSÉES ; elles ne sont
 *   facturées que si le chauffeur les valide (paramètre supplementTemps, ajustable).
 */
export function computePrice({
  distanceKm,
  durationMin,
  date,
  depart = "",
  arrivee = "",
  promo = false,
  dureeReelleMin = null,
  supplementTemps = null, // { minutes, prixMinute?, montant? } — validé par le chauffeur
  prixFinal = null, // prix convenu avec le client (hors temps supplémentaire)
  forfait = null, // prix forfaitaire TTC : remplace tout le calcul au kilomètre
  tarifs = DEFAULT_TARIFS,
}) {
  const t = { ...DEFAULT_TARIFS, ...tarifs, supplements: { ...DEFAULT_TARIFS.supplements, ...(tarifs?.supplements || {}) } };
  const km = Math.max(0, Number(distanceKm) || 0);
  const prixKm = promo ? t.prixKmPromo : t.prixKm;
  const lines = [];

  const forfaitN = Number(forfait) || 0;
  let reason = null;
  let course = 0;
  let convenu = NaN;
  let prixCalcule = 0;
  if (forfaitN > 0) {
    // Forfait : un seul montant, tout compris (pas de km, de majoration ni de supplément aéroport).
    lines.push({ code: "forfait", label: "Forfait transport", amount: round2(forfaitN) });
    course = prixCalcule = round2(forfaitN);
  } else {
    lines.push({ code: "pec", label: "Prise en charge", amount: round2(t.priseEnCharge) });
    lines.push({
      code: "km",
      label: `Distance ${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km × ${prixKm.toFixed(2).replace(".", ",")} €${promo ? " (tarif promo)" : ""}`,
      amount: round2(km * prixKm),
    });

    const base = lines.reduce((s, l) => s + l.amount, 0);
    reason = majorationReason(date, t);
    if (reason && t.majorationPct) {
      lines.push({
        code: "maj",
        label: `Majoration ${t.majorationPct} % (${reason})`,
        amount: round2((base * t.majorationPct) / 100),
      });
    }

    for (const a of detectAirports(depart, arrivee)) {
      const amount = Number(t.supplements[a]) || 0;
      if (amount) lines.push({ code: `apt_${a}`, label: `Supplément aéroport ${AIRPORTS[a].label}`, amount: round2(amount) });
    }

    course = round2(lines.reduce((s, l) => s + l.amount, 0));
    if (course < t.minimum) {
      lines.push({ code: "min", label: `Complément prix minimum (${t.minimum} €)`, amount: round2(t.minimum - course) });
      course = t.minimum;
    }

    // Prix convenu : on garde les vrais kilomètres et on ajoute une remise (ou un ajustement)
    // pour que le total tombe exactement sur le prix annoncé au client.
    convenu = prixFinal === null || prixFinal === "" ? NaN : Number(prixFinal);
    prixCalcule = course;
    if (convenu > 0 && round2(convenu) !== course) {
      const diff = round2(convenu - course);
      lines.push({ code: "ajust", label: diff < 0 ? "Remise commerciale" : "Ajustement de prix", amount: diff });
      course = round2(convenu);
    }
  }

  // Le temps supplémentaire n'est jamais ajouté automatiquement : il est seulement
  // proposé (minutesSupProposees). Le chauffeur le valide et l'ajuste via `supplementTemps`.
  const estimated = Math.round(Number(durationMin) || 0);
  let minutesSupProposees = 0;
  if (estimated > 0 && dureeReelleMin != null && dureeReelleMin !== "") {
    const depassement = Math.round(Number(dureeReelleMin)) - estimated;
    if (depassement > t.toleranceMin) minutesSupProposees = depassement - t.toleranceMin;
  }
  let minutesSup = 0;
  if (supplementTemps) {
    minutesSup = Math.max(0, Math.round(Number(supplementTemps.minutes) || 0));
    const pm = supplementTemps.prixMinute ?? t.prixMinuteSup;
    const montant = supplementTemps.montant != null && supplementTemps.montant !== "" ? Number(supplementTemps.montant) : minutesSup * pm;
    if (montant > 0) {
      lines.push({
        code: "minsup",
        label: minutesSup > 0 ? `Temps supplémentaire ${minutesSup} min` : "Temps supplémentaire",
        amount: round2(montant),
      });
    }
  }

  const ttc = round2(lines.reduce((s, l) => s + l.amount, 0));
  const ht = round2(ttc / (1 + t.tva / 100));
  const tva = round2(ttc - ht);

  return {
    lines,
    ttc,
    ht,
    tva,
    tauxTva: t.tva,
    majoration: reason,
    minutesSup,
    minutesSupProposees,
    prixCalcule,
    forfait: forfaitN > 0 ? round2(forfaitN) : null,
    prixConvenu: convenu > 0 ? round2(convenu) : null,
    dureeEstimeeMin: estimated,
    seuilMinutesSup: estimated + t.toleranceMin,
    prixMinuteSup: t.prixMinuteSup,
    toleranceMin: t.toleranceMin,
  };
}

export const euro = (n) =>
  (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
