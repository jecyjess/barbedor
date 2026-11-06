import { euro } from "../lib/pricing.js";

const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Devis (+ bon de réservation) ou facture, prêt à imprimer / enregistrer en PDF. */
export default function DocumentView({ course, settings, type }) {
  const e = settings.entreprise;
  const isFacture = type === "facture";
  const q = isFacture ? course.facture.price : course.devis.price;
  const numero = isFacture ? course.facture.numero : course.devis.numero;
  const dateDoc = isFacture ? course.facture.date : course.devis.date;
  const validite = new Date(new Date(course.devis.date).getTime() + settings.validiteDevisJours * 86400000);

  return (
    <article className="doc" id="printable">
      <header className="doc-head">
        <div className="doc-brand">
          {e.logo ? <img src={e.logo} alt="" className="doc-logo" /> : <div className="doc-mono">{(e.marque || e.nom || "V").replace(/^groupe\s+/i, "").slice(0, 1)}</div>}
          <div>
            <div className="doc-company">{e.marque || e.nom}</div>
            {e.chauffeur && <div className="strong">{e.chauffeur}</div>}
            {e.statutChauffeur && <div>{e.statutChauffeur}</div>}
            {e.telephone && <div>Tél. {e.telephone}</div>}
            {e.email && <div>{e.email}</div>}
            {e.marque && (
              <div className="doc-issuer">
                {isFacture ? "Facture émise par" : "Devis établi par"} <b>{e.nom}</b>
                <div className="pre">{e.adresse}</div>
              </div>
            )}
            {!e.marque && (
              <>
                {e.forme && <div>{e.forme}</div>}
                <div className="pre">{e.adresse}</div>
              </>
            )}
          </div>
        </div>
        <div className="doc-title">
          <h1>{isFacture ? "Facture" : "Devis"}</h1>
          <div className="doc-num">N° {numero}</div>
          <div>Émis le {fmtDate(dateDoc)}</div>
          {!isFacture && <div>Valable jusqu'au {fmtDate(validite)}</div>}
        </div>
      </header>

      <section className="doc-parties">
        <div>
          <div className="doc-label">Client</div>
          <div className="strong">{course.client.nom || "—"}</div>
          {course.client.adresse && <div className="pre">{course.client.adresse}</div>}
          {course.client.telephone && <div>{course.client.telephone}</div>}
          {course.client.email && <div>{course.client.email}</div>}
        </div>
        <div>
          <div className="doc-label">{isFacture ? "Prestation" : "Réservation préalable"}</div>
          <div>Transport de personnes en VTC</div>
          <div>{fmtDateTime(course.datetime)}</div>
          {!isFacture && <div>Réservée le {fmtDateTime(course.createdAt)}</div>}
          {course.passagers > 0 && <div>{course.passagers} passager(s){course.bagages > 0 ? `, ${course.bagages} bagage(s)` : ""}</div>}
        </div>
      </section>

      <section className="doc-route">
        <div><span className="dot a" />{course.route?.origin || course.depart}</div>
        <div><span className="dot b" />{course.route?.destination || course.arrivee}</div>
        <div className="doc-route-meta">
          {course.route?.distanceKm} km · durée {isFacture && course.facture.supplementValide ? `réelle ${course.facture.dureeReelleMin} min (estimée ${q.dureeEstimeeMin} min)` : `estimée ${q.dureeEstimeeMin} min`}
        </div>
      </section>

      <table className="doc-table">
        <thead>
          <tr><th>Désignation</th><th>Montant TTC</th></tr>
        </thead>
        <tbody>
          {q.lines.map((l) => (
            <tr key={l.code}><td>{l.label}</td><td>{euro(l.amount)}</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td>Total HT</td><td>{euro(q.ht)}</td></tr>
          <tr><td>TVA {q.tauxTva} %</td><td>{euro(q.tva)}</td></tr>
          <tr className="grand"><td>Total TTC</td><td>{euro(q.ttc)}</td></tr>
        </tfoot>
      </table>

      {!isFacture && (
        <section className="doc-notes">
          <p>
            <b>Durée estimée : {q.dureeEstimeeMin} min</b>, selon le trafic prévu à l'heure de la course. Une tolérance de {q.toleranceMin} min est
            incluse. Au-delà de {q.seuilMinutesSup} min de trajet, chaque minute supplémentaire sera facturée {euro(q.prixMinuteSup)} TTC.
          </p>
          <p>Devis gratuit. Prix TTC, TVA {q.tauxTva} % incluse.</p>
          <div className="sign">Bon pour accord — date et signature du client :</div>
        </section>
      )}

      {isFacture && (
        <section className="doc-notes">
          {course.facture.paiement && (
            <p>
              <b>Facture acquittée</b> le {fmtDate(course.facture.datePaiement || dateDoc)} — règlement par {course.facture.paiement}.
            </p>
          )}
          {!course.facture.paiement && <p>Paiement à réception de la facture{e.iban ? ` — IBAN : ${e.iban}` : ""}.</p>}
          <p>Devis de référence : {course.devis.numero}.</p>
        </section>
      )}

      <footer className="doc-foot">
        {[
          e.nom + (e.forme ? ` — ${e.forme}` : ""),
          e.adresse.replace(/\n/g, " "),
          e.siret && `SIRET ${e.siret}`,
          e.rcs,
          e.tvaIntra && `TVA intracom. ${e.tvaIntra}`,
          e.evtc && `Registre VTC n° ${e.evtc}`,
        ].filter(Boolean).join(" · ")}
      </footer>
    </article>
  );
}

export function documentSummary(course, type) {
  const isF = type === "facture";
  const q = isF ? course.facture.price : course.devis.price;
  const num = isF ? course.facture.numero : course.devis.numero;
  return [
    `${isF ? "Facture" : "Devis"} ${num}`,
    `${course.client.nom || ""}`.trim(),
    `${new Date(course.datetime).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}`,
    `De : ${course.route?.origin || course.depart}`,
    `À : ${course.route?.destination || course.arrivee}`,
    `${course.route?.distanceKm} km — durée estimée ${q.dureeEstimeeMin} min`,
    `Total : ${euro(q.ttc)} TTC (dont TVA ${euro(q.tva)})`,
  ].filter(Boolean).join("\n");
}
