import { useState } from "react";
import { DEFAULT_TARIFS } from "../lib/pricing.js";

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

export default function Settings({ settings, onSave }) {
  const [s, setS] = useState(settings);
  const [saved, setSaved] = useState(false);
  const ent = (k) => (e) => setS({ ...s, entreprise: { ...s.entreprise, [k]: e.target.value } });
  const tar = (k) => (e) => setS({ ...s, tarifs: { ...s.tarifs, [k]: e.target.value === "" ? "" : +e.target.value } });
  const sup = (k) => (e) => setS({ ...s, tarifs: { ...s.tarifs, supplements: { ...s.tarifs.supplements, [k]: +e.target.value } } });

  function logo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setS({ ...s, entreprise: { ...s.entreprise, logo: r.result } });
    r.readAsDataURL(file);
  }
  function save() {
    onSave(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }
  const num = (v, on, step = "0.01") => <input type="number" step={step} inputMode="decimal" value={v} onChange={on} />;

  return (
    <div className="screen">
      <h2 className="screen-title">Réglages</h2>

      <section className="card">
        <div className="card-title">Ce que voit le client</div>
        <Field label="Nom commercial"><input value={s.entreprise.marque} onChange={ent("marque")} /></Field>
        <Field label="Chauffeur"><input value={s.entreprise.chauffeur} onChange={ent("chauffeur")} /></Field>
        <Field label="Statut"><input value={s.entreprise.statutChauffeur} onChange={ent("statutChauffeur")} /></Field>
        <div className="row">
          <Field label="Téléphone"><input value={s.entreprise.telephone} onChange={ent("telephone")} /></Field>
          <Field label="E-mail"><input value={s.entreprise.email} onChange={ent("email")} /></Field>
        </div>
        <Field label="Logo">
          <div className="logo-row">
            {s.entreprise.logo && <img src={s.entreprise.logo} alt="" className="logo-prev" />}
            <input type="file" accept="image/*" onChange={logo} />
          </div>
        </Field>
      </section>

      <section className="card">
        <div className="card-title">Émetteur légal de la facture</div>
        <Field label="Raison sociale"><input value={s.entreprise.nom} onChange={ent("nom")} /></Field>
        <Field label="Forme juridique" hint="ex. SCIC SAS à capital variable — capital 6 004 €"><input value={s.entreprise.forme} onChange={ent("forme")} /></Field>
        <Field label="Adresse"><textarea rows={2} value={s.entreprise.adresse} onChange={ent("adresse")} /></Field>
        <div className="row">
          <Field label="SIRET"><input value={s.entreprise.siret} onChange={ent("siret")} /></Field>
          <Field label="N° TVA intracom."><input value={s.entreprise.tvaIntra} onChange={ent("tvaIntra")} /></Field>
        </div>
        <Field label="RCS"><input value={s.entreprise.rcs} onChange={ent("rcs")} /></Field>
        <Field label="N° d'inscription au registre VTC"><input value={s.entreprise.evtc} onChange={ent("evtc")} /></Field>
        <Field label="IBAN (factures non réglées)"><input value={s.entreprise.iban} onChange={ent("iban")} /></Field>
      </section>

      <section className="card">
        <div className="card-title">Tarifs (TTC)</div>
        <div className="row">
          <Field label="Prise en charge (€)">{num(s.tarifs.priseEnCharge, tar("priseEnCharge"))}</Field>
          <Field label="Prix minimum (€)">{num(s.tarifs.minimum, tar("minimum"))}</Field>
        </div>
        <div className="row">
          <Field label="Prix au km (€)">{num(s.tarifs.prixKm, tar("prixKm"))}</Field>
          <Field label="Prix au km promo (€)">{num(s.tarifs.prixKmPromo, tar("prixKmPromo"))}</Field>
        </div>
        <div className="row">
          <Field label="Majoration (%)" hint="nuit, week-end, fériés">{num(s.tarifs.majorationPct, tar("majorationPct"), "1")}</Field>
          <Field label="TVA (%)">{num(s.tarifs.tva, tar("tva"), "0.1")}</Field>
        </div>
        <div className="row">
          <Field label="Début de nuit (h)">{num(s.tarifs.nuitDebut, tar("nuitDebut"), "1")}</Field>
          <Field label="Fin de nuit (h)">{num(s.tarifs.nuitFin, tar("nuitFin"), "1")}</Field>
        </div>
        <div className="row">
          <Field label="Minute supplémentaire (€)">{num(s.tarifs.prixMinuteSup, tar("prixMinuteSup"))}</Field>
          <Field label="Tolérance (min)">{num(s.tarifs.toleranceMin, tar("toleranceMin"), "1")}</Field>
        </div>
        <div className="row three">
          <Field label="Orly (€)">{num(s.tarifs.supplements.orly, sup("orly"))}</Field>
          <Field label="CDG (€)">{num(s.tarifs.supplements.cdg, sup("cdg"))}</Field>
          <Field label="Beauvais (€)">{num(s.tarifs.supplements.beauvais, sup("beauvais"))}</Field>
        </div>
        <button className="btn ghost" onClick={() => setS({ ...s, tarifs: DEFAULT_TARIFS })}>Rétablir la grille par défaut</button>
      </section>

      <section className="card">
        <div className="card-title">Services connectés</div>
        <Field label="Clé Google Maps" hint="Trafic en temps réel et saisie d'adresse. Sans clé : OpenStreetMap avec trafic estimé.">
          <input type="password" value={s.googleMapsKey} onChange={(e) => setS({ ...s, googleMapsKey: e.target.value.trim() })} placeholder="AIza…" />
        </Field>
        <Field label="Clé IA (Anthropic)" hint="Comprend la dictée et remplit la fiche. Sans clé : analyse locale plus simple.">
          <input type="password" value={s.anthropicKey} onChange={(e) => setS({ ...s, anthropicKey: e.target.value.trim() })} placeholder="sk-ant-…" />
        </Field>
        <Field label="Validité des devis (jours)">{num(s.validiteDevisJours, (e) => setS({ ...s, validiteDevisJours: +e.target.value }), "1")}</Field>
        <small className="muted">Les clés restent uniquement sur ce téléphone.</small>
      </section>

      <button className="btn gold wide big sticky-save" onClick={save}>{saved ? "Enregistré ✓" : "Enregistrer"}</button>
    </div>
  );
}
