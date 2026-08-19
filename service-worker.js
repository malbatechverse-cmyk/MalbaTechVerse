// Malba TechVerse — Service Worker
// Responsável por deixar o site "instalável" (PWA) e funcionar offline básico.

const CACHE_NAME = "malba-techverse-v2";
const CORE_ASSETS = [
  "index.html",
  "mapa.html",
  "scanner.html",
  "perfil.html",
  "css/style.css",
  "js/install-prompt.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para HTML (conteúdo sempre atualizado),
// cache-first para assets estáticos (css/js/icons).
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
