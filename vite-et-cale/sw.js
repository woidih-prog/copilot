/* Vite & Calé a déménagé sur https://viteetcale.fr/. Ce fichier remplace l'ancien service worker :
   il vide son cache et se retire, pour que l'ancienne adresse serve la page de redirection. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: "window" }))
    .then(cs => cs.forEach(c => c.navigate(c.url))));
});
