import { useRef, useState } from "react";
import { downloadBackup, readBackupFile, restoreBackup } from "../lib/backup.js";
import { disconnectDrive } from "../lib/drive.js";
import { restoreFromDrive, syncDrive } from "../lib/sync.js";
import { loadCourses } from "../lib/storage.js";

const fmt = (d) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "jamais");

export default function BackupSettings({ settings, onChange }) {
  const b = settings.backup || {};
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const file = useRef(null);
  const set = (patch) => onChange({ ...settings, backup: { ...b, ...patch } });

  async function run(label, fn) {
    setBusy(label);
    setMsg(null);
    try {
      setMsg({ kind: "ok", text: await fn() });
    } catch (e) {
      setMsg({ kind: "warn", text: e.message });
    }
    setBusy("");
  }

  const syncNow = () =>
    run("sync", async () => {
      const r = await syncDrive(settings, loadCourses(), { interactive: true });
      set({ folderId: r.folder.id, folderLink: r.folder.webViewLink, folderShown: r.folder.name, last: r.date, connected: true });
      return `Sauvegardé dans « ${r.folder.name} » (${r.envoyes} document(s) envoyé(s)).`;
    });

  const restoreDrive = () =>
    run("restore", async () => {
      if (!confirm("Remplacer les courses de ce téléphone par la sauvegarde du Drive ?")) return "Restauration annulée.";
      const r = await restoreFromDrive(settings);
      setTimeout(() => window.location.reload(), 1200);
      return `Sauvegarde du ${fmt(r.date)} restaurée (${r.courses} courses). Redémarrage…`;
    });

  async function restoreFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    run("file", async () => {
      const data = await readBackupFile(f);
      if (!confirm("Remplacer les courses de ce téléphone par ce fichier ?")) return "Restauration annulée.";
      const r = restoreBackup(data);
      setTimeout(() => window.location.reload(), 1200);
      return `Sauvegarde du ${fmt(r.date)} restaurée (${r.courses} courses). Redémarrage…`;
    });
  }

  return (
    <section className="card">
      <div className="card-title">Sauvegarde</div>
      <div className="seg">
        <button className={b.mode === "drive" ? "on" : ""} onClick={() => set({ mode: "drive" })}>Google Drive (recommandé)</button>
        <button className={b.mode === "local" ? "on" : ""} onClick={() => set({ mode: "local" })}>Téléphone seulement</button>
      </div>

      {b.mode === "drive" && (
        <>
          <label>Identifiant Google de l'application (Client ID)
            <input value={b.clientId || ""} onChange={(e) => set({ clientId: e.target.value.trim() })} placeholder="xxxx.apps.googleusercontent.com" autoComplete="off" />
          </label>
          <label>Nom du dossier dans le Drive
            <input value={b.folderName || "VTC Facture"} onChange={(e) => set({ folderName: e.target.value, folderId: null })} />
          </label>
          <div className="hint">
            {b.folderId ? (
              <>Dossier : {b.folderLink ? <a href={b.folderLink} target="_blank" rel="noreferrer">{b.folderShown || b.folderName}</a> : b.folderShown} · dernière sauvegarde : {fmt(b.last)}. Vous pouvez le déplacer ou le renommer dans le Drive, il sera retrouvé.</>
            ) : (
              "Pas encore connecté."
            )}
          </div>
          <div className="row wrap">
            <button className="btn gold" disabled={!b.clientId || busy} onClick={syncNow}>{busy === "sync" ? "Sauvegarde…" : b.connected ? "Sauvegarder maintenant" : "Connecter Google Drive"}</button>
            <button className="btn" disabled={!b.clientId || busy} onClick={restoreDrive}>{busy === "restore" ? "Restauration…" : "Restaurer depuis le Drive"}</button>
            {b.connected && <button className="btn ghost" onClick={() => { disconnectDrive(); set({ connected: false }); }}>Déconnecter</button>}
          </div>
          <label className="switch">
            <input type="checkbox" checked={b.auto !== false} onChange={(e) => set({ auto: e.target.checked })} />
            <span />Sauvegarde automatique après chaque devis ou facture
          </label>
        </>
      )}

      <div className="row wrap">
        <button className="btn" disabled={!!busy} onClick={() => { const d = downloadBackup(); setMsg({ kind: "ok", text: `Fichier de sauvegarde créé (${d.courses.length} courses).` }); }}>Exporter un fichier</button>
        <button className="btn" disabled={!!busy} onClick={() => file.current?.click()}>Restaurer un fichier</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={restoreFile} />
      </div>
      {msg && <div className={`toast ${msg.kind}`}>{msg.text}</div>}
    </section>
  );
}
