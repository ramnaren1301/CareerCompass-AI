const CACHE = "pathwayos-v9-native-webmcp-diagnostics";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/service-worker.js",
  "/src/app.js", "/src/data.js", "/src/engine.js", "/src/store.js",
  "/src/webmcp.js", "/src/site-tools.js", "/src/buddy-journey.js", "/src/icons.js", "/src/dom-patch.js",
  "/src/career-catalog.js", "/src/career-catalog-data.js",
  "/data/pathwayos-career-catalog.json", "/public/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html"))));
});
