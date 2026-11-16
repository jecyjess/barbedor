/** Une seule fois : où garder une copie des devis et factures ? */
export default function BackupChoice({ onChoose }) {
  return (
    <div className="screen onboarding">
      <div className="ob-head">
        <div className="ob-mark">◆</div>
        <h2 className="screen-title">Vos sauvegardes</h2>
        <p className="muted">Vos courses restent toujours sur ce téléphone, même hors ligne. Où voulez-vous en garder une copie ?</p>
      </div>
      <section className="card">
        <button className="choice-btn rec" onClick={() => onChoose("drive")}>
          <b>Google Drive</b> <span className="pill">recommandé</span>
          <small>Copie automatique dans un dossier « VTC Facture » : chaque devis et facture, et une sauvegarde complète. Changement de téléphone : on se reconnecte et tout revient.</small>
        </button>
        <button className="choice-btn" onClick={() => onChoose("local")}>
          <b>Ce téléphone seulement</b>
          <small>Vous exportez vous-même un fichier de sauvegarde quand vous le souhaitez. Si le téléphone est perdu, les données le sont aussi.</small>
        </button>
        <button className="link" onClick={() => onChoose(null)}>Choisir plus tard (Réglages → Sauvegarde)</button>
      </section>
    </div>
  );
}
