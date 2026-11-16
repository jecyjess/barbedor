// Copie automatique vers Google Drive : sauvegarde complète + un document lisible par devis/facture.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentView from "../components/DocumentView.jsx";
import { buildBackup, restoreBackup } from "./backup.js";
import { connectDrive, currentToken, ensureFolder, putFile, readFile } from "./drive.js";

export const BACKUP_NAME = "vtc-facture-sauvegarde.json";
const SENT_KEY = "vtc.drive.sent"; // documents déjà envoyés (pour n'envoyer que les nouveautés)

function docCss() {
  const keep = /(^|[\s,.])(doc|dot|sig|signed|sign|pre|strong)/;
  let css = "";
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.selectorText && (keep.test(r.selectorText) || r.selectorText === ":root")) css += r.cssText + "\n";
    }
  }
  return css;
}

export function documentHtml(course, settings, type) {
  const body = renderToStaticMarkup(createElement(DocumentView, { course, settings, type }));
  const num = type === "facture" ? course.facture.numero : course.devis.numero;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${num}</title><style>body{margin:0;background:#f3f1ec;font-family:Inter,system-ui,sans-serif}.doc{max-width:760px;margin:24px auto;box-shadow:0 10px 40px rgba(0,0,0,.08)}@media print{body{background:#fff}.doc{margin:0;box-shadow:none}}${docCss()}</style></head><body>${body}</body></html>`;
}

function docsOf(courses) {
  const list = [];
  for (const c of courses) {
    const client = (c.client?.nom || "client").replace(/[\\/:*?"<>|]/g, "").slice(0, 40);
    list.push({ c, type: "devis", name: `${c.devis.numero} - ${client}.html`, sig: `${c.devis.price.ttc}|${c.devis.signature ? "s" : ""}` });
    if (c.facture) list.push({ c, type: "facture", name: `${c.facture.numero} - ${client}.html`, sig: `${c.facture.price.ttc}|${c.facture.paiement || ""}` });
  }
  return list;
}

/**
 * Envoie la sauvegarde et les nouveaux documents.
 * interactive=true : peut ouvrir la fenêtre Google (bouton « Connecter »).
 * Retourne { folder, envoyes } ; lève une erreur code 401 si une reconnexion est nécessaire.
 */
export async function syncDrive(settings, courses, { interactive = false } = {}) {
  const b = settings.backup || {};
  let token = currentToken();
  if (!token) {
    if (!interactive) throw Object.assign(new Error("Reconnexion Google nécessaire."), { code: 401 });
    token = await connectDrive(b.clientId);
  }
  const folder = await ensureFolder(token, b.folderName || "VTC Facture", b.folderId);
  await putFile(token, folder.id, BACKUP_NAME, JSON.stringify(buildBackup()), "application/json");
  let sent = {};
  try { sent = JSON.parse(localStorage.getItem(SENT_KEY) || "{}"); } catch { /* ignore */ }
  if (sent.__folder !== folder.id) sent = { __folder: folder.id };
  let envoyes = 0;
  for (const d of docsOf(courses)) {
    if (sent[d.name] === d.sig) continue;
    await putFile(token, folder.id, d.name, documentHtml(d.c, settings, d.type), "text/html");
    sent[d.name] = d.sig;
    envoyes++;
  }
  try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch { /* ignore */ }
  return { folder, envoyes, date: new Date().toISOString() };
}

export async function restoreFromDrive(settings) {
  const b = settings.backup || {};
  const token = currentToken() || (await connectDrive(b.clientId));
  const folder = await ensureFolder(token, b.folderName || "VTC Facture", b.folderId);
  const data = await readFile(token, folder.id, BACKUP_NAME);
  if (!data) throw new Error(`Aucune sauvegarde dans le dossier « ${folder.name} ».`);
  return restoreBackup(data);
}
