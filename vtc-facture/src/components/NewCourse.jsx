import { useEffect, useMemo, useRef, useState } from "react";
import Recorder from "./Recorder.jsx";
import { extractCourse } from "../lib/extract.js";
import { computeRoute, loadGoogleMaps } from "../lib/route.js";
import { computePrice, euro } from "../lib/pricing.js";
import { nextNumber, saveAudio, uid } from "../lib/storage.js";

const pad = (n) => String(n).padStart(2, "0");
function defaults() {
  const d = new Date(Date.now() + 60 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, heure: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
const EMPTY = () => ({
  nom: "", telephone: "", email: "", adresse: "",
  depart: "", arrivee: "", ...defaults(),
  passagers: 1, bagages: 0, notes: "", promo: false,
});

function AddressInput({ value, onChange, placeholder, googleKey, icon }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!googleKey || !ref.current) return;
    let ac;
    loadGoogleMaps(googleKey)
      .then((maps) => {
        if (!maps.places?.Autocomplete || !ref.current) return;
        ac = new maps.places.Autocomplete(ref.current, { componentRestrictions: { country: "fr" }, fields: ["formatted_address", "name"] });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          if (!p) return;
          const label = p.name && p.formatted_address && !p.formatted_address.startsWith(p.name) ? `${p.name}, ${p.formatted_address}` : p.formatted_address || p.name;
          if (label) onChange(label);
        });
      })
      .catch(() => {});
    return () => ac && window.google?.maps?.event?.clearInstanceListeners(ac);
  }, [googleKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="addr">
      <span className={`dot ${icon}`} />
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

export default function NewCourse({ settings, onCreated }) {
  const [f, setF] = useState(EMPTY);
  const [transcript, setTranscript] = useState("");
  const [audio, setAudio] = useState(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? (v.target.type === "checkbox" ? v.target.checked : v.target.value) : v }));

  const datetime = useMemo(() => new Date(`${f.date}T${f.heure || "00:00"}`), [f.date, f.heure]);
  const price = useMemo(
    () =>
      route &&
      computePrice({ distanceKm: route.distanceKm, durationMin: route.durationMin, date: datetime, depart: f.depart, arrivee: f.arrivee, promo: f.promo, tarifs: settings.tarifs }),
    [route, datetime, f.depart, f.arrivee, f.promo, settings.tarifs]
  );

  // Toute modification d'adresse invalide l'itinéraire calculé.
  useEffect(() => setRoute(null), [f.depart, f.arrivee]);

  async function analyse() {
    if (!transcript.trim()) return;
    setBusy("analyse");
    setMsg(null);
    const { data, engine, error } = await extractCourse(transcript, settings.anthropicKey);
    setF((s) => ({
      ...s,
      nom: data.client_nom || s.nom,
      telephone: data.client_telephone || s.telephone,
      email: data.client_email || s.email,
      depart: data.depart || s.depart,
      arrivee: data.arrivee || s.arrivee,
      date: data.date || s.date,
      heure: data.heure || s.heure,
      passagers: data.passagers || s.passagers,
      bagages: data.bagages || s.bagages,
      notes: data.notes || s.notes,
    }));
    setMsg({ kind: error ? "warn" : "ok", text: error ? `IA indisponible (${error}) — fiche remplie par ${engine}.` : `Fiche remplie par ${engine}. Vérifiez puis calculez le trajet.` });
    setBusy("");
  }

  async function calc() {
    setBusy("route");
    setMsg(null);
    try {
      setRoute(await computeRoute({ origin: f.depart, destination: f.arrivee, date: datetime, googleKey: settings.googleMapsKey }));
    } catch (e) {
      setMsg({ kind: "warn", text: e.message });
    }
    setBusy("");
  }

  async function createDevis() {
    const id = uid();
    let audioId = null;
    if (audio) {
      audioId = id;
      await saveAudio(id, audio);
    }
    const now = new Date().toISOString();
    onCreated({
      id,
      createdAt: now,
      client: { nom: f.nom.trim(), telephone: f.telephone.trim(), email: f.email.trim(), adresse: f.adresse.trim() },
      depart: f.depart, arrivee: f.arrivee,
      datetime: datetime.toISOString(),
      passagers: +f.passagers || 0, bagages: +f.bagages || 0, notes: f.notes,
      promo: f.promo, transcript, audioId, route,
      devis: { numero: nextNumber("D"), date: now, price },
      facture: null,
    });
    setF(EMPTY());
    setTranscript("");
    setAudio(null);
    setRoute(null);
    setMsg(null);
  }

  return (
    <div className="screen">
      <h2 className="screen-title">Nouvelle course</h2>

      <section className="card">
        <Recorder transcript={transcript} onTranscript={setTranscript} onAudio={setAudio} />
        <button className="btn primary wide" disabled={!transcript.trim() || busy} onClick={analyse}>
          {busy === "analyse" ? "Analyse en cours…" : "Remplir la fiche depuis la dictée"}
        </button>
        {audio && <div className="hint">Enregistrement audio conservé avec la course.</div>}
      </section>

      {msg && <div className={`toast ${msg.kind}`}>{msg.text}</div>}

      <section className="card">
        <div className="card-title">Trajet</div>
        <AddressInput icon="a" value={f.depart} onChange={set("depart")} placeholder="Adresse de prise en charge" googleKey={settings.googleMapsKey} />
        <AddressInput icon="b" value={f.arrivee} onChange={set("arrivee")} placeholder="Destination" googleKey={settings.googleMapsKey} />
        <div className="row">
          <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Heure<input type="time" value={f.heure} onChange={set("heure")} /></label>
        </div>
        <div className="row">
          <label>Passagers<input type="number" min="0" inputMode="numeric" value={f.passagers} onChange={set("passagers")} /></label>
          <label>Bagages<input type="number" min="0" inputMode="numeric" value={f.bagages} onChange={set("bagages")} /></label>
        </div>
        <label className="switch">
          <input type="checkbox" checked={f.promo} onChange={set("promo")} />
          <span />Tarif promotion ({String(settings.tarifs.prixKmPromo).replace(".", ",")} €/km)
        </label>
      </section>

      <section className="card">
        <div className="card-title">Client</div>
        <input value={f.nom} onChange={set("nom")} placeholder="Nom du client" />
        <div className="row">
          <input value={f.telephone} onChange={set("telephone")} placeholder="Téléphone" inputMode="tel" />
          <input value={f.email} onChange={set("email")} placeholder="E-mail" inputMode="email" />
        </div>
        <input value={f.notes} onChange={set("notes")} placeholder="Notes (n° de vol, siège enfant…)" />
      </section>

      <button className="btn primary wide big" disabled={!f.depart || !f.arrivee || busy} onClick={calc}>
        {busy === "route" ? "Calcul de l'itinéraire…" : route ? "Recalculer le trajet" : "Calculer le trajet et le prix"}
      </button>

      {route && price && (
        <section className="card quote">
          <div className="quote-top">
            <div>
              <div className="quote-total">{euro(price.ttc)}</div>
              <div className="muted">TTC · dont TVA {euro(price.tva)}</div>
            </div>
            <div className="quote-meta">
              <div><b>{route.distanceKm}</b> km</div>
              <div>≈ <b>{route.durationMin}</b> min</div>
            </div>
          </div>
          <div className="row">
            <label>Distance (km)<input type="number" step="0.1" value={route.distanceKm} onChange={(e) => setRoute({ ...route, distanceKm: +e.target.value })} /></label>
            <label>Durée (min)<input type="number" value={route.durationMin} onChange={(e) => setRoute({ ...route, durationMin: +e.target.value })} /></label>
          </div>
          <ul className="lines">
            {price.lines.map((l) => (
              <li key={l.code}><span>{l.label}</span><span>{euro(l.amount)}</span></li>
            ))}
          </ul>
          <div className="hint">
            Source : {route.source}. Au-delà de {price.seuilMinutesSup} min, {euro(price.prixMinuteSup)} par minute supplémentaire.
          </div>
          <button className="btn gold wide big" onClick={createDevis}>Créer le devis</button>
        </section>
      )}
    </div>
  );
}
