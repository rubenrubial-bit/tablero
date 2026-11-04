const CACHE = "tablero-v6";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* La página siempre se pide primero a internet (así las actualizaciones se ven al momento);
   solo si no hay conexión se usa la copia guardada. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const esPagina = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (esPagina) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copia)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (url.origin === location.origin || url.host.includes("fonts.g")) {
        const copia = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return res;
    }))
  );
});
