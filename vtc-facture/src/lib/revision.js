// Modification d'un devis : correction (même numéro) ou avenant (numéro + lettre A, B, C…).

/** Numéro de base, sans la lettre d'avenant. */
export const baseNumero = (devis) => devis.baseNumero || devis.numero;

/** Lettre du prochain avenant : A pour le premier, puis B, C… */
export const nextLetter = (devis) => String.fromCharCode(65 + (devis.versions?.length || 0));

/** Un devis signé ne peut plus être corrigé en silence : il faut un avenant. */
export const mustBeAvenant = (course) => !!course.devis.signature;

/**
 * Applique les modifications au devis.
 * - correction : même numéro, prix et texte mis à jour, date de modification notée ;
 * - avenant : l'ancienne version est archivée, nouveau numéro « …-A », signature à refaire.
 */
export function applyDevisEdit(course, fields, price, { avenant = false, now = new Date() } = {}) {
  if (course.facture) throw new Error("La facture est émise : le devis ne peut plus être modifié.");
  if (mustBeAvenant(course) && !avenant) throw new Error("Ce devis est signé : créez un avenant.");
  const next = { ...course, ...fields };
  const d = course.devis;
  if (avenant) {
    const { versions = [], ...ancienne } = d;
    next.devis = {
      numero: `${baseNumero(d)}-${nextLetter(d)}`,
      baseNumero: baseNumero(d),
      date: now.toISOString(),
      price,
      signature: null,
      versions: [...versions, { ...ancienne, archiveLe: now.toISOString(), snapshot: snapshotOf(course) }],
    };
  } else {
    next.devis = { ...d, price, modifie: now.toISOString() };
  }
  return next;
}

/** Ce qui décrit la course dans une version archivée (pour garder l'historique lisible). */
function snapshotOf(c) {
  return {
    client: c.client, depart: c.depart, arrivee: c.arrivee, datetime: c.datetime,
    passagers: c.passagers, bagages: c.bagages, notes: c.notes, route: c.route,
    promo: c.promo, prixFinal: c.prixFinal, forfait: c.forfait, approche: c.approche,
  };
}
