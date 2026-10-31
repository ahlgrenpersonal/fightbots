const CACHE_NAME = "fightbots-world50";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=world50",
  "./app.js?v=world50",
  "./version.json",
  "./manifest.webmanifest",
  "./assets/icon.svg"
];
const INDEX_FALLBACK = "./index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("fightbots-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const scope = new URL("./", self.location.href);
  if (event.request.method !== "GET" || url.origin !== scope.origin ||
      !url.pathname.startsWith(scope.pathname) ||
      url.pathname.startsWith(scope.pathname + "bot-adventure/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("./", copy.clone());
            cache.put(INDEX_FALLBACK, copy);
          });
          return response;
        })
        .catch(() => caches.match(INDEX_FALLBACK).then((match) => match || caches.match("./")))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
