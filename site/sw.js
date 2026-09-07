/* The worker caches app assets only. The app never fetches submitted links. */
const CACHE_PREFIX = 'secondlook:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './lib/scanner.js', './lib/passwords.js',
  './manifest.webmanifest', './assets/favicon.svg', './assets/icon-192.png',
  './assets/icon-512.png', './assets/manrope-variable.ttf',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Network-first keeps ordinary deployments fresh, with cached offline fallback.
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') await cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const index = await cache.match('./index.html');
        if (index) return index;
      }
      return new Response('This asset is not available offline yet. Reconnect and reload SecondLook.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
