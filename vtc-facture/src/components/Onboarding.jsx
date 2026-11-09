import { useState } from "react";
import { APP_NAME } from "../lib/edition.js";

/** Premier lancement : le chauffeur saisit les informations qui apparaîtront sur ses factures. */
export default function Onboarding({ settings, onDone }) {
  const [e, setE] = useState(settings.entreprise);
  const [franchise, setFranchise] = useState(settings.tvaFranchise);
  const [step, setStep] = useState(1);
  const set = (k) => (ev) => setE({ ...e, [k]: ev.target.value });

  const step1ok = e.chauffeur.trim() && e.telephone.trim();
  const step2ok = e.nom.trim() && e.adresse.trim() && e.siret.trim();

  function finish() {
    const prefixe = (e.prefixe || e.marque || e.nom).normalize("NFD").replace(/[^\w]/g, "").toUpperCase().slice(0, 8);
    onDone({
      ...settings,
      configured: true,
      tvaFranchise: franchise,
      entreprise: { ...e, prefixe },
      tarifs: { ...settings.tarifs, tva: franchise ? 0 : settings.tarifs.tva || 10 },
    });
  }

  return (
    <div className="screen onboarding">
      <div className="ob-head">
        <div className="ob-mark">◆</div>
        <h2 className="screen-title">{APP_NAME}</h2>
        <p className="muted">Vos devis et factures VTC dictés à la voix. Trois questions pour commencer : ces informations apparaîtront sur vos factures et restent sur votre téléphone.</p>
        <div className="ob-steps">{[1, 2, 3].map((n) => <span key={n} className={n <= step ? "on" : ""} />)}</div>
      </div>

      {step === 1 && (
        <section className="card">
          <div className="card-title">1. Vous</div>
          <label>Votre nom et prénom *<input value={e.chauffeur} onChange={set("chauffeur")} placeholder="Jean Dupont" autoComplete="name" /></label>
          <label>Nom commercial (facultatif)<input value={e.marque} onChange={set("marque")} placeholder="ex. Dupont Prestige" /></label>
          <label>Téléphone *<input value={e.telephone} onChange={set("telephone")} inputMode="tel" placeholder="06 12 34 56 78" autoComplete="tel" /></label>
          <label>E-mail<input value={e.email} onChange={set("email")} inputMode="email" placeholder="vous@exemple.fr" autoComplete="email" /></label>
          <label>N° de carte professionnelle VTC<input value={e.carteVtc} onChange={set("carteVtc")} /></label>
          <button className="btn gold wide big" disabled={!step1ok} onClick={() => setStep(2)}>Continuer</button>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <div className="card-title">2. L'entreprise qui facture</div>
          <p className="hint">Votre société, votre micro-entreprise, ou la coopérative pour laquelle vous travaillez.</p>
          <label>Raison sociale *<input value={e.nom} onChange={set("nom")} placeholder="ex. Dupont VTC, ou nom de la coopérative" /></label>
          <label>Forme juridique<input value={e.forme} onChange={set("forme")} placeholder="ex. Micro-entreprise, SASU au capital de 1 000 €" /></label>
          <label>Adresse *<textarea rows={2} value={e.adresse} onChange={set("adresse")} placeholder={"12 rue Exemple\n75000 Paris"} /></label>
          <label>SIRET *<input value={e.siret} onChange={set("siret")} inputMode="numeric" placeholder="14 chiffres" /></label>
          <label>RCS (facultatif)<input value={e.rcs} onChange={set("rcs")} placeholder="ex. 123 456 789 R.C.S. Paris" /></label>
          <label>N° d'inscription au registre VTC<input value={e.evtc} onChange={set("evtc")} placeholder="EVTC…" /></label>
          <div className="row">
            <button className="btn" onClick={() => setStep(1)}>Retour</button>
            <button className="btn gold" disabled={!step2ok} onClick={() => setStep(3)}>Continuer</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <div className="card-title">3. TVA</div>
          <label className="choice">
            <input type="radio" name="tva" checked={!franchise} onChange={() => setFranchise(false)} />
            <span><b>Je facture la TVA (10 %)</b><br /><small className="muted">Société, ou micro-entreprise ayant dépassé le seuil</small></span>
          </label>
          <label className="choice">
            <input type="radio" name="tva" checked={franchise} onChange={() => setFranchise(true)} />
            <span><b>Je ne facture pas la TVA</b><br /><small className="muted">Franchise en base : « TVA non applicable, art. 293 B du CGI »</small></span>
          </label>
          {!franchise && <label>N° de TVA intracommunautaire<input value={e.tvaIntra} onChange={set("tvaIntra")} placeholder="FR…" /></label>}
          <p className="hint">Grille par défaut (TTC) : prise en charge 5 €, 1,50 €/km, +20 % nuit et week-end, minimum 15 €, suppléments aéroports. Tout se modifie ensuite dans Réglages.</p>
          <div className="row">
            <button className="btn" onClick={() => setStep(2)}>Retour</button>
            <button className="btn gold" onClick={finish}>Commencer</button>
          </div>
        </section>
      )}
    </div>
  );
}
