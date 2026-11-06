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
    origin: res.originAddresses?.[0] || origin,
    destination: res.destinationAddresses?.[0] || destination,
  };
}

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&accept-language=fr&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const j = await r.json();
  if (!j[0]) throw new Error(`Adresse introuvable : ${q}`);
  return { lat: +j[0].lat, lon: +j[0].lon, label: j[0].display_name };
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

async function osmRoute(origin, destination, date) {
  const [a, b] = await Promise.all([geocode(origin), geocode(destination)]);
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const j = await (await fetch(url)).json();
  const r = j.routes?.[0];
  if (!r) throw new Error("Itinéraire introuvable (OSM)");
  return {
    distanceKm: Math.round(r.distance / 100) / 10,
    durationMin: Math.round((r.duration / 60) * trafficFactor(date)),
    source: "OpenStreetMap (trafic estimé)",
    origin: a.label,
    destination: b.label,
  };
}

export async function computeRoute({ origin, destination, date, googleKey }) {
  if (!origin || !destination) throw new Error("Indiquez le départ et l'arrivée");
  if (googleKey) {
    try {
      return await googleRoute(googleKey, origin, destination, date);
    } catch (e) {
      console.warn("Google indisponible, bascule OSM :", e);
    }
  }
  return osmRoute(origin, destination, date);
}
