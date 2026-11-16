// Hors ligne : l'application s'ouvre même sans réseau (dernière version téléchargée).
const CACHE = "vtc-facture-v1";
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icon.svg"]).catch(() => {})));
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // cartes, IA, Google : toujours en direct
  if (req.mode === "navigate") {
    // Page : réseau d'abord (pour avoir les mises à jour), sinon la copie.
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Fichiers de l'application : copie d'abord, sinon réseau (et on garde une copie).
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; }))
  );
});
