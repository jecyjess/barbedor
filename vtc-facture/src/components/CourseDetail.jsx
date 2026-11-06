import { useEffect, useState } from "react";
import DocumentView, { documentSummary } from "./DocumentView.jsx";
import { computePrice, euro } from "../lib/pricing.js";
import { loadAudio, nextNumber } from "../lib/storage.js";

const PAIEMENTS = ["carte bancaire", "espèces", "virement", "chèque"];

export default function CourseDetail({ course, settings, onUpdate, onDelete, onBack }) {
  const [tab, setTab] = useState(course.facture ? "facture" : "devis");
  const [audioUrl, setAudioUrl] = useState(null);
  const [showFact, setShowFact] = useState(false);
  const [duree, setDuree] = useState(course.devis.price.dureeEstimeeMin);
  const [paiement, setPaiement] = useState("carte bancaire");

  useEffect(() => {
    let url;
    if (course.audioId) loadAudio(course.audioId).then((b) => b && setAudioUrl((url = URL.createObjectURL(b))));
    return () => url && URL.revokeObjectURL(url);
  }, [course.audioId]);

  const priceArgs = {
    distanceKm: course.route.distanceKm,
    durationMin: course.route.durationMin,
    date: new Date(course.datetime),
    depart: course.depart,
    arrivee: course.arrivee,
    promo: course.promo,
    dureeReelleMin: duree,
    tarifs: settings.tarifs,
  };
  const proposal = computePrice(priceArgs).minutesSupProposees;

  // Supplément de temps : proposé, jamais ajouté sans votre validation.
  const [supOn, setSupOn] = useState(false);
  const [supMin, setSupMin] = useState(0);
  const [supPrix, setSupPrix] = useState(settings.tarifs.prixMinuteSup);
  const [supMontant, setSupMontant] = useState(""); // vide = minutes × prix
  useEffect(() => {
    setSupMin(proposal);
    setSupMontant("");
    if (!proposal) setSupOn(false);
  }, [proposal]);

  const preview = computePrice({
    ...priceArgs,
    supplementTemps: supOn ? { minutes: supMin, prixMinute: Number(supPrix) || 0, montant: supMontant } : null,
  });
  const montantCalcule = Math.round((Number(supMin) || 0) * (Number(supPrix) || 0) * 100) / 100;

  function facturer() {
    const now = new Date().toISOString();
    onUpdate({
      ...course,
      facture: { numero: nextNumber("F"), date: now, price: preview, dureeReelleMin: +duree, supplementValide: supOn, paiement: paiement || null, datePaiement: paiement ? now : null },
    });
    setShowFact(false);
    setTab("facture");
  }

  const summary = documentSummary(course, tab);
  const title = `${tab === "facture" ? "Facture" : "Devis"} ${tab === "facture" ? course.facture.numero : course.devis.numero}`;

  function print() {
    const prev = document.title;
    document.title = `${title} - ${course.client.nom || "client"}`;
    window.print();
    setTimeout(() => (document.title = prev), 500);
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, text: summary }); } catch { /* annulé */ }
    } else {
      await navigator.clipboard?.writeText(summary);
      alert("Résumé copié dans le presse-papiers.");
    }
  }
  const phone = (course.client.telephone || "").replace(/[^\d+]/g, "").replace(/^0/, "33").replace(/^\+/, "");

  return (
    <div className="screen">
      <div className="detail-head no-print">
        <button className="btn ghost" onClick={onBack}>‹ Courses</button>
        <div className="seg">
          <button className={tab === "devis" ? "on" : ""} onClick={() => setTab("devis")}>Devis</button>
          <button className={tab === "facture" ? "on" : ""} disabled={!course.facture} onClick={() => setTab("facture")}>Facture</button>
        </div>
      </div>

      <div className="doc-wrap"><DocumentView course={course} settings={settings} type={tab} /></div>

      <div className="actions no-print">
        <button className="btn primary" onClick={print}>PDF / Imprimer</button>
        <button className="btn" onClick={share}>Partager</button>
        {phone && <a className="btn" href={`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
        {course.client.email && <a className="btn" href={`mailto:${course.client.email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(summary)}`}>E-mail</a>}
      </div>

      {!course.facture && (
        <section className="card no-print">
          {!showFact ? (
            <button className="btn gold wide big" onClick={() => setShowFact(true)}>Course terminée → Facturer</button>
          ) : (
            <>
              <div className="card-title">Clôturer la course</div>
              <div className="row">
                <label>Durée réelle (min)<input type="number" inputMode="numeric" value={duree} onChange={(e) => setDuree(e.target.value)} /></label>
                <label>Paiement
                  <select value={paiement} onChange={(e) => setPaiement(e.target.value)}>
                    {PAIEMENTS.map((p) => <option key={p}>{p}</option>)}
                    <option value="">non réglé</option>
                  </select>
                </label>
              </div>
              <div className="hint">
                Estimée : {preview.dureeEstimeeMin} min · tolérance {preview.toleranceMin} min
                {!proposal && " · pas de dépassement"}
              </div>

              {proposal > 0 && (
                <div className={`extra ${supOn ? "on" : ""}`}>
                  <label className="switch small">
                    <input type="checkbox" checked={supOn} onChange={(e) => setSupOn(e.target.checked)} />
                    <span />
                    <em>+{proposal} min · {euro(proposal * settings.tarifs.prixMinuteSup)}</em>
                  </label>
                  {supOn && (
                    <div className="row three">
                      <label>Minutes<input type="number" inputMode="numeric" min="0" value={supMin} onChange={(e) => { setSupMin(e.target.value); setSupMontant(""); }} /></label>
                      <label>€ / min<input type="number" inputMode="decimal" step="0.05" min="0" value={supPrix} onChange={(e) => { setSupPrix(e.target.value); setSupMontant(""); }} /></label>
                      <label>Montant €<input type="number" inputMode="decimal" step="0.5" min="0" value={supMontant === "" ? montantCalcule : supMontant} onChange={(e) => setSupMontant(e.target.value)} /></label>
                    </div>
                  )}
                </div>
              )}
              <div className="quote-total small">{euro(preview.ttc)} TTC</div>
              <div className="row">
                <button className="btn" onClick={() => setShowFact(false)}>Annuler</button>
                <button className="btn gold" onClick={facturer}>Émettre la facture</button>
              </div>
            </>
          )}
        </section>
      )}

      {(course.transcript || audioUrl) && (
        <section className="card no-print">
          <div className="card-title">Dictée d'origine</div>
          {audioUrl && <audio controls src={audioUrl} className="audio" />}
          {course.transcript && <p className="muted pre">{course.transcript}</p>}
        </section>
      )}

      {!course.facture && (
        <button className="btn danger ghost wide no-print" onClick={() => confirm("Supprimer ce devis ?") && onDelete(course.id)}>
          Supprimer le devis
        </button>
      )}
    </div>
  );
}
