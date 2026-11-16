import { useEffect, useMemo, useRef, useState } from "react";
import Recorder from "./Recorder.jsx";
import { extractCourse } from "../lib/extract.js";
import { computeRoute, loadGoogleMaps, getPosition, reverseGeocode } from "../lib/route.js";
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
  passagers: 1, bagages: 0, notes: "", promo: false, prixFinal: "", forfaitOn: false, forfait: "", approcheMode: "non", approcheSrc: null, approcheDepuis: "",
});

function AddressInput({ value, onChange, placeholder, googleKey, icon, onLocate, locating }) {
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
      {onLocate && (
        <button type="button" className={`locate ${locating ? "busy" : ""}`} onClick={onLocate} disabled={locating} aria-label="Partir de ma position" title="Partir de ma position">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="7" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** « je viens de Versailles » → adresse dite ; « bureau » / « ma position » → bouton correspondant. */
function approcheDite(v, s) {
  const x = (v || "").trim();
  if (!x || /^\d+\s?(?:km|kilo)/i.test(x)) return {};
  if (/^(?:MA_POSITION|ici|là|ma position)/i.test(x)) return { approcheSrc: "gps", approcheDepuis: "" };
  if (/bureau|domicile|maison|chez moi/i.test(x)) return { approcheSrc: "bureau", approcheDepuis: "" };
  return { approcheDepuis: x, approcheSrc: null, ...(s ? {} : {}) };
}

export default function NewCourse({ settings, onCreated }) {
  const [f, setF] = useState(EMPTY);
  const [transcript, setTranscript] = useState("");
  const [audio, setAudio] = useState(null);
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [pos, setPos] = useState(null); // position GPS utilisée comme départ
  const [app, setApp] = useState(null); // approche calculée : { km, min, src, label, error }
  const gps = settings.gps !== false;

  async function locate() {
    setBusy("gps");
    setMsg(null);
    try {
      const p = await getPosition();
      const label = await reverseGeocode(p.lat, p.lon);
      setPos({ ...p, at: Date.now() });
      setF((s) => ({ ...s, depart: label }));
      setMsg({ kind: "ok", text: `Départ : votre position${p.accuracy ? ` (précision ${Math.round(p.accuracy)} m)` : ""}.` });
    } catch (e) {
      setMsg({ kind: "warn", text: e.message });
    }
    setBusy("");
  }
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? (v.target.type === "checkbox" ? v.target.checked : v.target.value) : v }));

  const datetime = useMemo(() => new Date(`${f.date}T${f.heure || "00:00"}`), [f.date, f.heure]);
  const price = useMemo(
    () =>
      route &&
      computePrice({ distanceKm: route.distanceKm, durationMin: route.durationMin, date: datetime, depart: f.depart, arrivee: f.arrivee, promo: f.promo, prixFinal: f.prixFinal, forfait: f.forfaitOn ? f.forfait : null, approcheKm: app?.km, approcheMode: f.approcheMode, tarifs: settings.tarifs }),
    [route, datetime, f.depart, f.arrivee, f.promo, f.prixFinal, f.forfaitOn, f.forfait, app, f.approcheMode, settings.tarifs]
  );

  // Toute modification d'adresse invalide l'itinéraire calculé.
  // (sauf si la dictée a donné la distance / la durée : on les reprend).
  const dictated = useRef(null);
  useEffect(() => {
    setRoute(dictated.current);
    dictated.current = null;
    setApp(null);
  }, [f.depart, f.arrivee]);

  /** D'où part l'approche : ce qui a été dit, sinon le choix, sinon GPS si la course est dans l'heure, sinon le bureau. */
  function approcheSource(choice) {
    if (choice) return choice;
    if (f.approcheDepuis) return "dit";
    if (f.approcheSrc) return f.approcheSrc;
    return datetime.getTime() - Date.now() < 3600000 ? "gps" : "bureau";
  }

  async function computeApproche(choice) {
    const src = approcheSource(choice);
    if (!f.depart) return;
    setBusy("approche");
    try {
      if (src === "gps") {
        if (!gps) throw new Error("Position GPS désactivée dans Réglages.");
        if (pos) {
          setApp({ km: 0, min: 0, src, label: "votre position (vous êtes au départ)" });
        } else {
          const p = await getPosition();
          const r = await computeRoute({ origin: "Ma position", destination: f.depart, date: new Date(), googleKey: settings.googleMapsKey, originPos: p });
          setApp({ km: r.distanceKm, min: r.durationMin, src, label: "votre position" });
        }
      } else {
        const from = src === "dit" ? f.approcheDepuis : settings.adresseBase;
        if (!from) throw new Error("Adresse du bureau à renseigner dans Réglages → Approche.");
        const r = await computeRoute({ origin: from, destination: f.depart, date: datetime, googleKey: settings.googleMapsKey });
        setApp({ km: r.distanceKm, min: r.durationMin, src, label: src === "dit" ? from : "le bureau" });
      }
    } catch (e) {
      setApp({ km: "", min: "", src, label: "", error: e.message });
    }
    setBusy("");
  }

  async function analyse() {
    if (!transcript.trim()) return;
    setBusy("analyse");
    setMsg(null);
    const { data, engine, error } = await extractCourse(transcript, settings.anthropicKey);
    const fromHere = data.depart === "MA_POSITION";
    if (fromHere) data.depart = "";
    if (data.distance_km > 0) {
      dictated.current = { distanceKm: data.distance_km, durationMin: data.duree_min || "", source: "dictée", origin: data.depart || f.depart, destination: data.arrivee || f.arrivee };
      if ((data.depart || f.depart) === f.depart && (data.arrivee || f.arrivee) === f.arrivee) {
        setRoute(dictated.current);
        dictated.current = null;
      }
    }
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
      prixFinal: data.prix_final > 0 ? String(data.prix_final) : s.prixFinal,
      approcheMode: data.approche && data.approche !== "non" ? data.approche : s.approcheMode,
      ...approcheDite(data.approche_depuis, s),
    }));
    setMsg({ kind: error ? "warn" : "ok", text: error ? `IA indisponible (${error}) — fiche remplie par ${engine}.` : `Fiche remplie par ${engine}. Vérifiez puis calculez le trajet.` });
    setBusy("");
    if (fromHere) {
      if (gps) await locate();
      else setMsg({ kind: "warn", text: "Départ « d'ici » : activez la position GPS dans Réglages, ou saisissez l'adresse." });
    }
  }

  async function calc() {
    setBusy("route");
    setMsg(null);
    try {
      let originPos = pos;
      // Position de plus de 2 minutes : on la rafraîchit (le véhicule a pu bouger).
      if (pos && Date.now() - (pos.at || 0) > 120000) {
        try { originPos = await getPosition(); setPos({ ...originPos, at: Date.now() }); } catch { /* on garde l'ancienne */ }
      }
      setRoute(await computeRoute({ origin: f.depart, destination: f.arrivee, date: datetime, googleKey: settings.googleMapsKey, originPos }));
    } catch (e) {
      setMsg({ kind: "warn", text: `${e.message} — saisissez la distance et la durée à la main.` });
      manual();
    }
    setBusy("");
    await computeApproche();
  }

  function manual() {
    setRoute({ distanceKm: "", durationMin: "", source: "", origin: f.depart, destination: f.arrivee });
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
      promo: f.promo, prixFinal: !f.forfaitOn && Number(f.prixFinal) > 0 ? Number(f.prixFinal) : null,
      forfait: f.forfaitOn && Number(f.forfait) > 0 ? Number(f.forfait) : null, transcript, audioId,
      approche: app && !app.error ? { mode: f.approcheMode, km: Number(app.km) || 0, min: Number(app.min) || 0, depuis: app.label } : null,
      route: { ...route, distanceKm: Number(route.distanceKm) || 0, durationMin: Math.round(Number(route.durationMin) || 0), source: route.source || "saisie manuelle" },
      devis: { numero: nextNumber("D", settings.entreprise.prefixe), date: now, price },
      facture: null,
    });
    setF(EMPTY());
    setTranscript("");
    setAudio(null);
    setRoute(null);
    setApp(null);
    setMsg(null);
  }

  return (
    <div className="screen">
      <h2 className="screen-title">Nouvelle course</h2>

      <section className="card">
        <Recorder transcript={transcript} onTranscript={setTranscript} onAudio={setAudio} />
        <button className="btn primary wide" disabled={!transcript.trim() || busy} onClick={analyse}>
          {busy === "analyse" ? "Analyse en cours…" : transcript.trim() ? "Remplir la fiche depuis la dictée" : "Dictez d'abord la course"}
        </button>
        {audio && <div className="hint">Enregistrement audio conservé avec la course.</div>}
      </section>

      {msg && <div className={`toast ${msg.kind}`}>{msg.text}</div>}

      <section className="card">
        <div className="card-title">Trajet</div>
        <AddressInput icon="a" value={f.depart} onChange={(v) => { setPos(null); set("depart")(v); }} placeholder="Adresse de prise en charge" googleKey={settings.googleMapsKey} onLocate={gps ? locate : null} locating={busy === "gps"} />
        <AddressInput icon="b" value={f.arrivee} onChange={set("arrivee")} placeholder="Destination" googleKey={settings.googleMapsKey} />
        <div className="row">
          <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Heure<input type="time" value={f.heure} onChange={set("heure")} /></label>
        </div>
        <div className="row">
          <label>Passagers<input type="number" min="0" inputMode="numeric" value={f.passagers} onChange={set("passagers")} /></label>
          <label>Bagages<input type="number" min="0" inputMode="numeric" value={f.bagages} onChange={set("bagages")} /></label>
        </div>
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

      {!route && f.depart && f.arrivee && !busy && (
        <button className="btn ghost wide" onClick={manual}>Saisir la distance et la durée à la main</button>
      )}

      {route && price && (
        <section className="card quote">
          <div className="card-title">Ajuster la course</div>
          {route.source && !["dictée", "saisie manuelle"].includes(route.source) && (
            <div className="resolved">
              <div><span className="dot a" />{route.origin}</div>
              <div><span className="dot b" />{route.destination}</div>
            </div>
          )}
          <div className="row">
            <label>Distance (km)
              <input type="number" inputMode="decimal" step="0.1" min="0" value={route.distanceKm} onChange={(e) => setRoute({ ...route, distanceKm: e.target.value })} />
            </label>
            <label>Durée estimée (min)
              <input type="number" inputMode="numeric" min="0" value={route.durationMin} onChange={(e) => setRoute({ ...route, durationMin: e.target.value })} />
            </label>
          </div>
          <label className="switch">
            <input type="checkbox" checked={f.promo} onChange={set("promo")} />
            <span />Tarif promotion ({String(settings.tarifs.prixKmPromo).replace(".", ",")} €/km)
          </label>
          <div className="hint">
            Le prix suit la distance. La durée sert au devis et au calcul du dépassement :
            au-delà de {price.seuilMinutesSup} min, {euro(price.prixMinuteSup)} par minute (modifiable en fin de course).
            {route.source ? ` Source : ${route.source}.` : ""}
          </div>

          <div className="approche">
            <div className="approche-head">
              <span>Approche</span>
              {f.forfaitOn ? (
                <small className="muted">comprise dans le forfait</small>
              ) : (
                <div className="seg small">
                  {[["non", "Non"], ["facturee", "Facturée"], ["offerte", "Offerte"]].map(([v, l]) => (
                    <button key={v} className={f.approcheMode === v ? "on" : ""} onClick={() => setF((s) => ({ ...s, approcheMode: v }))}>{l}</button>
                  ))}
                </div>
              )}
            </div>
            {busy === "approche" && <div className="hint">Calcul de l'approche…</div>}
            {app?.error && <div className="hint warn">{app.error}</div>}
            {app && !app.error && busy !== "approche" && (
              <div className={`approche-info ${Number(app.km) > (settings.tarifs.approcheAlerteKm ?? 10) ? "alert" : ""}`}>
                {Number(app.km) > (settings.tarifs.approcheAlerteKm ?? 10) && "⚠ "}
                Depuis {app.label} : <b>{app.km} km</b> · arrivée sur place ≈ <b>{app.min} min</b>
                {Number(app.km) > (settings.tarifs.approcheAlerteKm ?? 10) && f.approcheMode === "non" && !f.forfaitOn && <> — pensez à compter l'approche</>}
              </div>
            )}
            <div className="row approche-row">
              <div className="seg small">
                {[["bureau", "Bureau"], ["gps", "Ma position"], ...(f.approcheDepuis ? [["dit", f.approcheDepuis.slice(0, 14)]] : [])].map(([v, l]) => (
                  <button key={v} className={app?.src === v ? "on" : ""} disabled={busy === "approche"}
                    onClick={() => { setF((s) => ({ ...s, approcheSrc: v === "dit" ? null : v, approcheDepuis: v === "dit" ? s.approcheDepuis : "" })); computeApproche(v); }}>{l}</button>
                ))}
              </div>
              {f.approcheMode !== "non" && !f.forfaitOn && (
                <label>Km d'approche
                  <input type="number" inputMode="decimal" step="0.1" min="0" value={app?.km ?? ""} onChange={(e) => setApp((a) => ({ ...(a || { min: "", src: "", label: "saisie" }), km: e.target.value, error: null }))} />
                </label>
              )}
            </div>
          </div>

          {!f.forfaitOn && (
            <>
          <label>Prix convenu avec le client (€) — facultatif
            <input type="number" inputMode="decimal" step="0.5" min="0" placeholder={`Prix calculé : ${price.prixCalcule}`} value={f.prixFinal} onChange={set("prixFinal")} />
          </label>
          {price.prixConvenu && Number(route.distanceKm) > 0 && (
            <div className="hint">Distance réelle conservée : une ligne « {price.prixConvenu < price.prixCalcule ? "Remise commerciale" : "Ajustement de prix"} » ramène le total à {euro(price.prixConvenu)}.</div>
          )}
            </>
          )}

          {!Number(route.distanceKm) && !f.forfaitOn ? (
            <div className="forfait-ask">
              <div>Pas de distance ? <b>Avez-vous un prix forfaitaire ?</b></div>
              <div className="row">
                <button className="btn gold" onClick={() => setF((s) => ({ ...s, forfaitOn: true }))}>Oui, forfait</button>
                <button className="btn" onClick={() => document.querySelector(".quote input")?.focus()}>Non, je saisis la distance</button>
              </div>
            </div>
          ) : f.forfaitOn && !(Number(f.forfait) > 0) ? (
            <>
              <label>Prix forfaitaire TTC (€)
                <input type="number" inputMode="decimal" step="0.5" min="0" autoFocus value={f.forfait} onChange={set("forfait")} placeholder="ex. 60" />
              </label>
              <button className="btn ghost" onClick={() => setF((s) => ({ ...s, forfaitOn: false, forfait: "" }))}>Annuler le forfait</button>
            </>
          ) : (
            <>
          {f.forfaitOn && (
            <div className="row forfait-row">
              <label>Prix forfaitaire TTC (€)
                <input type="number" inputMode="decimal" step="0.5" min="0" value={f.forfait} onChange={set("forfait")} />
              </label>
              <button className="btn ghost" onClick={() => setF((s) => ({ ...s, forfaitOn: false, forfait: "" }))}>Sans forfait</button>
            </div>
          )}
          <ul className="lines">
            {price.lines.map((l) => (
              <li key={l.code}><span>{l.label}</span><span>{euro(l.amount)}</span></li>
            ))}
          </ul>
          <div className="quote-bottom">
            <div className="muted">{price.tauxTva > 0 ? <>Total TTC<br />dont TVA {euro(price.tva)}</> : <>Total<br />TVA non applicable</>}</div>
            <div className="quote-total">{euro(price.ttc)}</div>
          </div>
            </>
          )}
          <button className="btn gold wide big" disabled={!(Number(route.distanceKm) > 0 || (f.forfaitOn && Number(f.forfait) > 0))} onClick={createDevis}>Créer le devis</button>
        </section>
      )}
    </div>
  );
}
