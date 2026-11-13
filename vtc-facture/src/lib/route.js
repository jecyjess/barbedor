// Calcul d'itinéraire : Google Maps (trafic réel) si une clé est configurée,
// sinon OpenStreetMap (Nominatim + OSRM) avec une estimation du trafic parisien.

let mapsPromise = null;

export function loadGoogleMaps(key) {
  if (!key) return Promise.reject(new Error("Pas de clé Google Maps"));
  if (window.google?.maps?.DistanceMatrixService) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const cb = "__vtcMapsReady";
    window[cb] = () => resolve(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=fr&region=FR&callback=${cb}&loading=async`;
    s.async = true;
    s.onerror = () => {
      mapsPromise = null;
      reject(new Error("Chargement de Google Maps impossible"));
    };
    document.head.appendChild(s);
  });
  return mapsPromise;
}

async function googleRoute(key, origin, destination, date) {
  const maps = await loadGoogleMaps(key);
  const svc = new maps.DistanceMatrixService();
  const future = date && date.getTime() > Date.now() + 60_000;
  const res = await svc.getDistanceMatrix({
    origins: [origin],
    destinations: [destination],
    travelMode: maps.TravelMode.DRIVING,
    unitSystem: maps.UnitSystem.METRIC,
    drivingOptions: { departureTime: future ? date : new Date(), trafficModel: maps.TrafficModel.BEST_GUESS },
    region: "fr",
  });
  const el = res.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") throw new Error("Itinéraire introuvable (Google)");
  const dur = el.duration_in_traffic || el.duration;
  return {
    distanceKm: Math.round(el.distance.value / 100) / 10,
    durationMin: Math.round(dur.value / 60),
    source: "Google Maps (trafic prévu)",
    origin: shortGoogle(res.originAddresses?.[0]) || origin,
    destination: shortGoogle(res.destinationAddresses?.[0]) || destination,
  };
}

/**
 * Adresse postale courte à partir d'un résultat OpenStreetMap :
 * « Mairie d'Issy, 62 Rue du Général Leclerc, 92130 Issy-les-Moulineaux »
 * (sans quartier, département, région ni pays).
 */
export function shortAddress(r) {
  const a = r?.address || {};
  const road = a.road || a.pedestrian || a.footway || a.square || a.place || "";
  const rue = [a.house_number, road].filter(Boolean).join(" ");
  const ville = a.city || a.town || a.village || a.municipality || a.hamlet || "";
  const cpVille = [a.postcode, ville].filter(Boolean).join(" ");
  const generic = ["highway", "place", "boundary", "building"].includes(r?.class) || r?.addresstype === "road";
  const nom = r?.name && !generic && r.name !== road && r.name !== ville ? r.name : "";
  const out = [nom, rue, cpVille].filter(Boolean).join(", ");
  return out || (r?.display_name || "").split(",").slice(0, 3).join(",").trim();
}

/** Adresse Google sans le pays : « 12 Rue X, 75004 Paris ». */
export const shortGoogle = (s) => (s || "").replace(/,\s*(France|FR)$/i, "").trim();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Variantes à essayer quand OpenStreetMap ne trouve pas l'adresse telle quelle
 * (il comprend mal « Nom du lieu, numéro rue, CP ville » en une seule phrase).
 */
export function geocodeCandidates(q) {
  const parts = q.split(",").map((p) => p.trim()).filter(Boolean);
  const list = [{ q, exact: true }];
  if (parts.length >= 3) list.push({ q: parts.slice(1).join(", "), exact: true }); // sans le nom du lieu
  if (parts.length >= 2) list.push({ q: `${parts[0]}, ${parts.at(-1)}`, exact: true }); // lieu + ville
  if (parts.length >= 2) list.push({ q: parts.at(-1), exact: false }); // ville seule : approximatif
  return list.filter((c, i, a) => a.findIndex((x) => x.q === c.q) === i);
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=fr&accept-language=fr&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  return (await r.json())[0] || null;
}

async function geocode(q) {
  const tries = geocodeCandidates(q);
  for (let i = 0; i < tries.length; i++) {
    if (i) await wait(1100); // OpenStreetMap demande au plus une recherche par seconde
    const hit = await nominatim(tries[i].q);
    if (hit) {
      return {
        lat: +hit.lat,
        lon: +hit.lon,
        // Trouvé tel quel : adresse courte d'OpenStreetMap. Sinon : on garde l'adresse dictée.
        label: i === 0 ? shortAddress(hit) : q,
        approx: !tries[i].exact,
      };
    }
  }
  throw new Error(`Adresse introuvable : ${q}`);
}

/** Coefficient de trafic Île-de-France approximatif, selon l'heure. */
export function trafficFactor(date) {
  const d = date instanceof Date && !isNaN(date) ? date : new Date();
  const h = d.getHours() + d.getMinutes() / 60;
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  if (h >= 22 || h < 6) return 1.05;
  if (weekend) return 1.2;
  if ((h >= 7 && h < 10) || (h >= 16.5 && h < 20)) return 1.6;
  return 1.3;
}

async function osmRoute(origin, destination, date, originPos = null) {
  const [a, b] = await Promise.all([
    originPos ? Promise.resolve({ lat: originPos.lat, lon: originPos.lon, label: origin }) : geocode(origin),
    geocode(destination),
  ]);
  // En roulant, on impose le sens de circulation au départ (impossible de faire demi-tour sur l'autoroute).
  const bearing = movingBearing(originPos);
  const extra = bearing != null ? `&bearings=${bearing},45;` : "";
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false${extra}`;
  const j = await (await fetch(url)).json();
  const r = j.routes?.[0];
  if (!r) throw new Error("Itinéraire introuvable (OSM)");
  return {
    distanceKm: Math.round(r.distance / 100) / 10,
    durationMin: Math.round((r.duration / 60) * trafficFactor(date)),
    source:
      (a.approx || b.approx ? "OpenStreetMap (trafic estimé) — adresse approximative, vérifiez la distance" : "OpenStreetMap (trafic estimé)") +
      (bearing != null ? " — depuis votre position, dans votre sens de circulation" : ""),
    origin: a.label,
    destination: b.label,
  };
}

/** Cap (0–359°) si le véhicule roule assez vite pour que le sens soit fiable, sinon null. */
export function movingBearing(pos) {
  if (!pos || pos.heading == null || isNaN(pos.heading) || !(pos.speed > 2)) return null;
  return Math.round(((pos.heading % 360) + 360) % 360);
}

/** Position GPS actuelle du téléphone. */
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Ce téléphone ne donne pas sa position."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, heading: p.coords.heading, speed: p.coords.speed, accuracy: p.coords.accuracy }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Position refusée : autorisez la localisation pour ce site dans les réglages du navigateur."
              : "Position introuvable pour le moment. Réessayez dans un endroit dégagé."
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 20000 }
    );
  });
}

/** Adresse courte d'une position GPS (« 12 Rue X, 93100 Montreuil »). */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=fr&lat=${lat}&lon=${lon}`;
    const j = await (await fetch(url, { headers: { Accept: "application/json" } })).json();
    const label = shortAddress({ ...j, name: "" });
    if (label) return `${label} (position GPS)`;
  } catch {
    /* hors ligne : on garde les coordonnées */
  }
  return `Position GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
}

export async function computeRoute({ origin, destination, date, googleKey, originPos = null }) {
  if (!origin || !destination) throw new Error("Indiquez le départ et l'arrivée");
  // Google ne tient pas compte du sens de circulation : en roulant, on passe par OpenStreetMap.
  if (googleKey && movingBearing(originPos) == null) {
    try {
      const o = originPos ? { lat: originPos.lat, lng: originPos.lon } : origin;
      const r = await googleRoute(googleKey, o, destination, date);
      return originPos ? { ...r, origin } : r;
    } catch (e) {
      console.warn("Google indisponible, bascule OSM :", e);
    }
  }
  return osmRoute(origin, destination, date, originPos);
}
