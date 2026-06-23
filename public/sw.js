// Version: 2.0.8
const CACHE_NAME = 'koszeg-weather-cache-v2.0.8';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/noise.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- Web Push előkészítés ---
// Akkor lép működésbe, ha a háttérben push üzenet érkezik (valódi háttér-értesítés,
// akkor is, ha az app nincs nyitva). Ehhez a kliensoldali feliratkozás + szerveroldali
// küldés (VAPID kulcsokkal, pl. Supabase Edge Function) szükséges.
self.addEventListener('push', (event) => {
  let payload = { title: 'Kőszegi Időjárás', body: 'Új figyelmeztetés érkezett.' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'koszeg-weather-alert',
      data: { url: payload.url || '/' }
    })
  );
});

// Értesítésre kattintva nyissuk meg/fókuszáljuk az appot.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ('focus' in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Bypass cache for Supabase requests
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // 2. Network-First for navigation requests (HTML pages)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Network-First for weather API requests (smartmixin.io)
  if (url.hostname === 'api2.smartmixin.io') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 4. Cache-First for static assets (like CSS, JS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
