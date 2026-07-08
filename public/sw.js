/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Service Worker for SCENTS & SOULS PERFUME LAB Offline Capability
const CACHE_NAME = 'scents-and-souls-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/favicon.ico',
];

// Installs and pre-caches the main core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Non-blocking pre-cache failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Cleans up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepts fetch requests to serve from cache or network
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests, Firebase / Firestore endpoints, and Hot Module Replacement (HMR) websocket connections
  if (
    req.method !== 'GET' ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.pathname.includes('/api/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return;
  }

  // Caching Strategy:
  // 1. For Google Fonts or Gstatic assets: Cache First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. For static assets (JS, CSS, images): Stale-While-Revalidate
  // This allows lightning fast renders while grabbing updates in the background.
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          console.log('[Service Worker] Fetch failed for asset, using cache fallback', err);
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. For pages/documents and other endpoints: Network-First with Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // If it's a valid response, cache it and return
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache on failure/offline
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If accessing main document, fallback to '/' or index.html
          if (req.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network connectivity required for this action.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});
