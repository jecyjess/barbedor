// Deux éditions construites à partir du même code :
// - "holam" : la version de Jean-Christophe (identité préremplie, clés IA/cartes possibles)
// - "sc"    : « sans clé », pour les testeurs : configuration au premier lancement, aucune clé
export const EDITION = import.meta.env.VITE_EDITION || "holam";
export const IS_SC = EDITION === "sc";
export const APP_NAME = IS_SC ? "VTC Facture SC" : "VTC Facture";
