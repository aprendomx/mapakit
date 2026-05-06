const TILE_CACHE = 'mapakit-tiles-v1';
const DATA_CACHE = 'mapakit-data-v1';
const TILE_PATTERN = /\.(png|jpg|jpeg|webp|pbf)/;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Tiles: stale-while-revalidate
  if (TILE_PATTERN.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(e.request, TILE_CACHE));
  }
  // JSON data/config: network-first with fallback
  else if (url.pathname.endsWith('.json') || url.pathname.includes('/rest/')) {
    e.respondWith(networkFirst(e.request, DATA_CACHE));
  }
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  
  const fetchPromise = fetch(req).then(response => {
    if (response.ok) {
      cache.put(req, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const network = await fetch(req);
    if (network.ok) {
      cache.put(req, network.clone());
    }
    return network;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) {
      return cached;
    }
    throw err;
  }
}
