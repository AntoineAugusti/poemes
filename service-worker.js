const cacheName = 'cache-v1';
const precacheResources = ['/', '/style.css', '/js.js', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(precacheResources)));
});

self.addEventListener('activate', (event) => {
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});