const CACHE_NAME = 'academia-chapiri-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo-academia-chapiri.png',
  '/favicon.png',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Estrategia de caché: Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en caché
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos obtener del caché
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Si no está en caché y es una página, devolvemos la página offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
          return new Response('', {
            status: 404,
            statusText: 'Not Found',
          });
        });
      })
  );
});
