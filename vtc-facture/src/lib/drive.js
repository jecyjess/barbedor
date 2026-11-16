// Sauvegarde Google Drive, directement depuis le téléphone (sans serveur).
// Droit demandé : drive.file — l'application ne voit QUE les fichiers qu'elle a créés.
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_KEY = "vtc.drive.token";

let gisPromise = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error("Connexion à Google impossible (hors ligne ?).")); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

function savedToken() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    return t && t.exp > Date.now() + 60000 ? t.token : null;
  } catch {
    return null;
  }
}

/** Jeton d'accès valide sans rien demander, ou null (il faudra « Reconnecter »). */
export const currentToken = savedToken;

/** Ouvre la fenêtre Google (à appeler depuis un geste de l'utilisateur). */
export async function connectDrive(clientId) {
  if (!clientId) throw new Error("Identifiant Google manquant (Réglages → Sauvegarde).");
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error("Connexion Google refusée."));
        try {
          localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000 }));
        } catch { /* ignore */ }
        resolve(r.access_token);
      },
      error_callback: () => reject(new Error("Connexion Google annulée.")),
    });
    client.requestAccessToken({ prompt: savedToken() ? "" : "consent" });
  });
}

export function disconnectDrive() {
  const t = savedToken();
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  if (t && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(t, () => {});
}

async function api(token, url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  if (r.status === 401) {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    throw Object.assign(new Error("Session Google expirée : touchez « Reconnecter »."), { code: 401 });
  }
  if (!r.ok) throw new Error(`Google Drive : erreur ${r.status}`);
  return r.status === 204 ? null : r.json();
}

/** Dossier de sauvegarde : on réutilise l'identifiant connu (même si le dossier a été déplacé ou renommé). */
export async function ensureFolder(token, name, knownId) {
  if (knownId) {
    try {
      const f = await api(token, `${API}/files/${knownId}?fields=id,name,trashed,webViewLink`);
      if (!f.trashed) return f;
    } catch (e) {
      if (e.code === 401) throw e;
    }
  }
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`);
  const found = await api(token, `${API}/files?q=${q}&fields=files(id,name,webViewLink)&spaces=drive`);
  if (found.files?.[0]) return found.files[0];
  return api(token, `${API}/files?fields=id,name,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder" }),
  });
}

/** Crée ou remplace un fichier (par son nom) dans le dossier. */
export async function putFile(token, folderId, name, content, mimeType) {
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`);
  const found = await api(token, `${API}/files?q=${q}&fields=files(id)`);
  const id = found.files?.[0]?.id;
  const boundary = "vtcfacture" + Math.random().toString(36).slice(2);
  const meta = id ? { name } : { name, parents: [folderId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;
  return api(token, `${UPLOAD}/files${id ? `/${id}` : ""}?uploadType=multipart&fields=id`, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

export async function readFile(token, folderId, name) {
  const q = encodeURIComponent(`name='${name}' and '${folderId}' in parents and trashed=false`);
  const found = await api(token, `${API}/files?q=${q}&fields=files(id,modifiedTime)`);
  const id = found.files?.[0]?.id;
  if (!id) return null;
  const r = await fetch(`${API}/files/${id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Google Drive : erreur ${r.status}`);
  return r.json();
}
