/*
 * Retirement service worker.
 *
 * WorkforceOS is always-online: serving a cached application shell can make
 * an installed iOS web app look outdated after a deployment. This worker
 * clears earlier Workbox caches and removes its own registration so future
 * launches always fetch the live Render release.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) =>
        Promise.all(clients.map((client) => client.navigate(client.url))),
      ),
  );
});