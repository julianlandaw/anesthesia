const CACHE_PREFIX = 'anesthesia-toolkit-';
const CACHE_NAME = 'anesthesia-toolkit-v4';
const NETWORK_TIMEOUT_MS = 3000;
const APP_SHELL = [
  './',
  './index.html',
  './drugdoses.html',
  './venthelper.html',
  './ponv.html',
  './abgcalc.html',
  './cardiacrisk.html',
  './preopguidelines.html',
  './404.html',
  './theme.css',
  './theme.js',
  './pwa.js',
  './calculations.js',
  './styles.css',
  './enhancements.css',
  './script.js',
  './manifest.webmanifest',
  './icon.svg',
  './social-card.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'OFFLINE_STATUS' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const entries = await Promise.all(
          APP_SHELL.map((path) => cache.match(new URL(path, self.registration.scope).href))
        );
        event.ports[0].postMessage({ ready: entries.every(Boolean) });
      } catch (_) {
        event.ports[0].postMessage({ ready: false });
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  const controller = new AbortController();
  let timer;
  // The timer also bounds browsers/networks that are slow to honor abort.
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Network timeout'));
    }, NETWORK_TIMEOUT_MS);
  });
  const network = Promise.race([fetch(request, { signal: controller.signal }), timeout]).finally(
    () => clearTimeout(timer)
  );

  // Register the lifetime promise synchronously so cache writes finish even
  // after the response has been delivered or the tab navigates away.
  event.waitUntil(
    network
      .then(async (response) => {
        if (response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, copy);
        }
      })
      .catch(() => {})
  );

  event.respondWith(
    (async () => {
      let response;
      try {
        response = await network;
        if (response.status < 500) return response;
      } catch (_) {
        /* A cached response can cover a failed or slow network. */
      }
      const cache = await caches.open(CACHE_NAME);
      const cached = (await cache.match(request)) || (await cache.match(url.origin + url.pathname));
      if (cached) return cached;
      if (response) return response;
      if (request.mode === 'navigate') {
        const missing = await cache.match(new URL('./404.html', self.registration.scope).href);
        if (missing)
          return new Response(await missing.text(), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
      }
      return Response.error();
    })()
  );
});
