/* Vite & Calé : l'appli marche hors connexion une fois ouverte une première fois,
   et se met à jour toute seule dès qu'une nouvelle version est en ligne. */
const CACHE = "vite-et-cale-v28";
const FICHIERS = ["./", "./index.html", "./recettes.js", "./prix.json", "./promos.json", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Réseau d'abord, en redemandant toujours au serveur s'il y a du nouveau (sinon le navigateur
   peut resservir une vieille copie pendant plusieurs minutes) ; la copie locale seulement hors connexion. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url), local = url.origin === location.origin;
  const req = local ? new Request(e.request, { cache: "no-cache" }) : e.request;
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok && (local || url.host.includes("fonts.g"))) {
        const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
