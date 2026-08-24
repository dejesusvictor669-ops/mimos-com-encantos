const CACHE_NAME = 'mimos-com-encanto-v2';
const APP_SHELL = [
  './',
  './index.html',
  './avaliacoes.html',
  './acompanhar-pedido.html',
  './faq.html',
  './produto.html',
  './css/style.css',
  './js/utils.js',
  './js/cart.js',
  './js/catalog.js',
  './js/reviews.js',
  './js/footer.js',
  './js/produto.js',
  './js/tracking.js',
  './js/admin.js',
  './manifest.webmanifest',
  './favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => cached || Response.error());
    })
  );
});
