/*
 * WorkforceOS Service Worker
 *
 * Strategy: Network-first for all requests.
 * - HTML (navigation) is NEVER cached — always fetched fresh from server.
 * - Static assets are cached with a versioned cache name; old caches
 *   are wiped on every activation so stale UI is never served.
 * - skipWaiting() ensures a newly installed SW takes control immediately
 *   without waiting for open tabs to close.
 * - clients.claim() means all currently-open tabs are immediately
 *   controlled by the new SW without needing a reload.
 *
 * Bump CACHE_VERSION on every production deploy to clear old caches.
 */

const CACHE_VERSION = '2026-07-30-v1';
const CACHE_NAME = `workforceos-${CACHE_VERSION}`;

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Take control immediately — do not wait for existing tabs to close
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        // Delete every cache that is NOT the current version
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }),
        ),
      )
      .then(() => {
        console.log('[SW] Activated — version:', CACHE_VERSION);
        // Claim all open clients so they use this new SW immediately
        return self.clients.claim();
      }),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Navigation requests (HTML pages) — ALWAYS network, never cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        // Fallback only if completely offline
        caches.match('/index.html'),
      ),
    );
    return;
  }

  // 2. Non-GET requests — pass through without caching
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // 3. API requests — network-only, never cache
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 4. Static assets — network-first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache a copy of the fresh response
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — try the cache as fallback
        return caches.match(request);
      }),
  );
});

// ─── Message handler ──────────────────────────────────────────────────────────
// Allows the page to trigger an immediate SW update via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
