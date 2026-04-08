const CACHE_NAME = "ghost-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/icons/ghost-192.svg", "/icons/ghost-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for static assets
  if (event.request.method !== "GET") return;

  // Skip WebSocket upgrade requests
  const url = new URL(event.request.url);
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses for static assets
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: return cached index for navigation requests
      if (event.request.mode === "navigate") {
        return caches.match("/index.html");
      }
      return new Response("Offline", { status: 503 });
    })
  );
});
