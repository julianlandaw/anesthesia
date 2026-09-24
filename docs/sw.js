const CACHE_NAME = 'anesthesia-toolkit-v3';
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
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first prevents an installed clinical calculator from remaining on
  // an old script or stylesheet after a deployment. The cache remains the
  // fallback when the device is offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
