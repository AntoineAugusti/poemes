const cacheName = "cache-v1";
const precacheResources = ["/", "/style.css", "/js.js", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(precacheResources)),
  );
});

self.addEventListener("activate", (event) => {});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith("http")) {
    return;
  }
  if (event.request.method === "POST") {
    return;
  }
  event.respondWith(update(event.request));
});

function update(request) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request)
      .then(function (response) {
        cache.put(request, response.clone());
        return response;
      })
      .catch(function () {
        return cache.match(request);
      });
  });
}
