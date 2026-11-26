// LiveE — oflayn işləmə üçün service worker
const CACHE = 'livee-v5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
// Canlı məlumat verən xidmətlər keşlənmir (həmişə internetdən)
const LIVE = /open-meteo\.com|wheretheiss\.at|swpc\.noaa\.gov|clouds\.matteason\.co\.uk/;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (LIVE.test(url.host)) return;

  // Öz fayllarımız: əvvəlcə internet, olmasa keş
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // CDN (three.js, teksturalar, şriftlər): əvvəlcə keş, olmasa internet
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
