import { useMemo, useState } from "react";
import { computePrice, euro } from "../lib/pricing.js";
import { applyDevisEdit, mustBeAvenant, nextLetter, baseNumero } from "../lib/revision.js";

const pad = (n) => String(n).padStart(2, "0");

/** Modifier un devis déjà créé : correction (même numéro) ou avenant (-A, -B…). */
export default function EditDevis({ course, settings, onCancel, onSave }) {
  const d0 = new Date(course.datetime);
  const [f, setF] = useState({
    nom: course.client.nom || "",
    telephone: course.client.telephone || "",
    email: course.client.email || "",
    adresse: course.client.adresse || "",
    depart: course.route?.origin || course.depart,
    arrivee: course.route?.destination || course.arrivee,
    date: `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`,
    heure: `${pad(d0.getHours())}:${pad(d0.getMinutes())}`,
    passagers: course.passagers ?? 1,
    bagages: course.bagages ?? 0,
    notes: course.notes || "",
    distanceKm: course.route?.distanceKm ?? 0,
    durationMin: course.route?.durationMin ?? 0,
    promo: !!course.promo,
    forfait: course.forfait ?? "",
    prixFinal: course.prixFinal ?? "",
    approcheMode: course.approche?.mode || "non",
    approcheKm: course.approche?.km ?? "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const datetime = useMemo(() => new Date(`${f.date}T${f.heure || "00:00"}`), [f.date, f.heure]);
  const isForfait = !!course.forfait;

  const price = useMemo(
    () =>
      computePrice({
        distanceKm: f.distanceKm,
        durationMin: f.durationMin,
        date: datetime,
        depart: f.depart,
        arrivee: f.arrivee,
        promo: f.promo,
        prixFinal: isForfait ? null : f.prixFinal,
        forfait: isForfait ? f.forfait : null,
        approcheKm: f.approcheKm,
        approcheMode: f.approcheMode,
        tarifs: settings.tarifs,
      }),
    [f, datetime, isForfait, settings.tarifs]
  );

  const signed = mustBeAvenant(course);
  const lettre = nextLetter(course.devis);

  function save(avenant) {
    const fields = {
      client: { ...course.client, nom: f.nom.trim(), telephone: f.telephone.trim(), email: f.email.trim(), adresse: f.adresse.trim() },
      depart: f.depart.trim(),
      arrivee: f.arrivee.trim(),
      datetime: datetime.toISOString(),
      passagers: +f.passagers || 0,
      bagages: +f.bagages || 0,
      notes: f.notes,
      promo: f.promo,
      forfait: isForfait ? Number(f.forfait) || null : null,
      prixFinal: !isForfait && Number(f.prixFinal) > 0 ? Number(f.prixFinal) : null,
      approche: course.approche || f.approcheMode !== "non" ? { ...(course.approche || {}), mode: f.approcheMode, km: Number(f.approcheKm) || 0 } : null,
      route: { ...course.route, origin: f.depart.trim(), destination: f.arrivee.trim(), distanceKm: Number(f.distanceKm) || 0, durationMin: Math.round(Number(f.durationMin) || 0) },
    };
    onSave(applyDevisEdit(course, fields, price, { avenant }));
  }

  return (
    <div className="screen">
      <div className="detail-head">
        <button className="btn ghost" onClick={onCancel}>‹ Annuler</button>
        <div className="muted">Devis {course.devis.numero}</div>
      </div>

      <section className="card">
        <div className="card-title">Client</div>
        <input value={f.nom} onChange={set("nom")} placeholder="Nom du client" />
        <div className="row">
          <input value={f.telephone} onChange={set("telephone")} placeholder="Téléphone" inputMode="tel" />
          <input value={f.email} onChange={set("email")} placeholder="E-mail" inputMode="email" />
        </div>
        <input value={f.adresse} onChange={set("adresse")} placeholder="Adresse du client (facultatif)" />
      </section>

      <section className="card">
        <div className="card-title">Trajet</div>
        <div className="addr"><span className="dot a" /><input value={f.depart} onChange={set("depart")} /></div>
        <div className="addr"><span className="dot b" /><input value={f.arrivee} onChange={set("arrivee")} /></div>
        <div className="row">
          <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Heure<input type="time" value={f.heure} onChange={set("heure")} /></label>
        </div>
        <div className="row">
          <label>Passagers<input type="number" min="0" inputMode="numeric" value={f.passagers} onChange={set("passagers")} /></label>
          <label>Bagages<input type="number" min="0" inputMode="numeric" value={f.bagages} onChange={set("bagages")} /></label>
        </div>
        <input value={f.notes} onChange={set("notes")} placeholder="Notes (n° de vol, siège enfant…)" />
      </section>

      <section className="card quote">
        <div className="card-title">Prix</div>
        {isForfait ? (
          <label>Prix forfaitaire TTC (€)<input type="number" inputMode="decimal" step="0.5" min="0" value={f.forfait} onChange={set("forfait")} /></label>
        ) : (
          <>
            <div className="row">
              <label>Distance (km)<input type="number" inputMode="decimal" step="0.1" min="0" value={f.distanceKm} onChange={set("distanceKm")} /></label>
              <label>Durée estimée (min)<input type="number" inputMode="numeric" min="0" value={f.durationMin} onChange={set("durationMin")} /></label>
            </div>
            <label className="switch"><input type="checkbox" checked={f.promo} onChange={set("promo")} /><span />Tarif promotion</label>
            <div className="approche-head">
              <span>Approche</span>
              <div className="seg small">
                {[["non", "Non"], ["facturee", "Facturée"], ["offerte", "Offerte"]].map(([v, l]) => (
                  <button key={v} className={f.approcheMode === v ? "on" : ""} onClick={() => setF((s) => ({ ...s, approcheMode: v }))}>{l}</button>
                ))}
              </div>
            </div>
            {f.approcheMode !== "non" && (
              <label>Km d'approche<input type="number" inputMode="decimal" step="0.1" min="0" value={f.approcheKm} onChange={set("approcheKm")} /></label>
            )}
            <label>Prix convenu avec le client (€) — facultatif
              <input type="number" inputMode="decimal" step="0.5" min="0" placeholder={`Prix calculé : ${price.prixCalcule}`} value={f.prixFinal} onChange={set("prixFinal")} />
            </label>
          </>
        )}
        <ul className="lines">
          {price.lines.map((l) => (
            <li key={l.code}><span>{l.label}</span><span>{euro(l.amount)}</span></li>
          ))}
        </ul>
        <div className="quote-bottom">
          <div className="muted">
            {price.ttc !== course.devis.price.ttc ? <>Avant : {euro(course.devis.price.ttc)}<br /></> : null}
            {price.tauxTva > 0 ? <>Total TTC · dont TVA {euro(price.tva)}</> : <>Total · TVA non applicable</>}
          </div>
          <div className="quote-total">{euro(price.ttc)}</div>
        </div>
      </section>

      <section className="card">
        {signed ? (
          <>
            <div className="hint warn">Ce devis est signé : la modification crée l'avenant {baseNumero(course.devis)}-{lettre}, à faire signer de nouveau. L'ancienne version est conservée.</div>
            <button className="btn gold wide big" onClick={() => save(true)}>Créer l'avenant {lettre}</button>
          </>
        ) : (
          <>
            <button className="btn gold wide big" onClick={() => save(false)}>Enregistrer la correction (même numéro)</button>
            <button className="btn wide" onClick={() => save(true)}>Créer un avenant ({baseNumero(course.devis)}-{lettre})</button>
            <div className="hint">Correction : pour une faute ou un petit détail. Avenant : nouvelle version numérotée, l'ancienne reste dans l'historique.</div>
          </>
        )}
      </section>
    </div>
  );
}
