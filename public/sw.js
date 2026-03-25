const CACHE_NAME = 'awrewards-v1';
const CACHE_NAME_DATA = 'awrewards-data-v1';
const PRECACHE = ['/', '/dashboard', '/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg', '/_next/static/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME && k !== CACHE_NAME_DATA) ? caches.delete(k) : Promise.resolve())))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Offline support for dashboard: serve cached HTML or fallback shell
  if (url.origin === self.location.origin) {
    // Cache-first for static assets
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg')) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          });
        })
      );
    } else {
      // Network-first for dynamic content, fallback to cache
      event.respondWith(
        fetch(event.request).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // fallback for navigation requests
            if (event.request.mode === 'navigate') return caches.match('/');
          });
        })
      );
    }
  }
});

self.addEventListener('message', (evt) => {
  if (evt.data === 'SKIP_WAITING' || evt.data.type === 'SKIP_WAITING') self.skipWaiting();
});