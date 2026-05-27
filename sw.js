// Cache-Version hochzählen erzwingt komplette Neu-Installation
const C = 'ag-v14-0527223824';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c => c.addAll(ASSETS))
  );
  // Sofort aktivieren, nicht auf Tab-Schließen warten
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))
    )
  );
  // Alle offenen Tabs sofort übernehmen
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Für HTML-Seiten: immer erst Netzwerk versuchen, dann Cache
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Für andere Assets: Cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(C).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
