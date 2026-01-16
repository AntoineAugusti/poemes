const CACHE_VERSION = "v2";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Ressources locales à pré-cacher
const PRECACHE_URLS = [
  "/",
  "/style.css",
  "/reset.css",
  "/js.js",
  "/theme.js",
  "/favicon.png",
];

// Installation : pré-cache des ressources statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Stratégie : cache-first pour les ressources statiques
function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      // Mise à jour en arrière-plan
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response);
            });
          }
        })
        .catch(() => {});
      return cached;
    }
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, clone);
        });
      }
      return response;
    });
  });
}

// Stratégie : network-first pour le contenu dynamique
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
        });
      }
      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

// Vérifier si c'est une ressource statique
function isStaticAsset(url) {
  const staticExtensions = [
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".woff",
    ".woff2",
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// Vérifier si c'est une ressource externe à cacher
function isExternalCacheable(url) {
  return (
    url.hostname === "cdnjs.cloudflare.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-HTTP et POST
  if (!event.request.url.startsWith("http") || event.request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes vers l'API
  if (url.pathname.startsWith("/api") || url.hostname.includes("api")) {
    return;
  }

  // Ressources statiques locales : cache-first
  if (url.origin === location.origin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Ressources externes (CDN, fonts) : cache-first
  if (isExternalCacheable(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Pages HTML et autres : network-first
  event.respondWith(networkFirst(event.request));
});
