const CACHE = 'fts-v12-auto-update';
const FILES = [
  './manifest.json',
  './assets/img/fts192.png',
  './assets/img/fts512.png',
  './membres.html',
  './forum.html',
  './messages.html',
  './profs.html'
];

// Force l'activation immédiate d'une nouvelle version envoyée par assets/js/fts-pwa.js
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(FILES.map(f => cache.add(f)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clientList => {
        clientList.forEach(client => client.postMessage({ type: 'FTS_SW_ACTIVATED', cache: CACHE }));
      })
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/sw.js')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

function normalizeNotificationUrl(rawUrl){
  const fallback = './membres.html';
  try {
    const base = self.location.origin + self.location.pathname.replace(/\/[^/]*$/, '/');
    return new URL(rawUrl || fallback, base).href;
  } catch(e) {
    return new URL(fallback, self.location.href).href;
  }
}

// ═══ NOTIFICATIONS PUSH ═══════════════════════════
self.addEventListener('push', function(event) {
  let data = { title: 'Fais Ton Show', body: 'Nouvelle notification', url: './membres.html' };
  try { if (event.data) data = event.data.json(); } catch(e) {}
  const url = normalizeNotificationUrl(data.url);
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fais Ton Show', {
      body: data.body || 'Nouvelle notification',
      icon: './assets/img/fts192.png',
      badge: './assets/img/fts192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || data.resourceId || data.messageId || data.conversationId || data.channel || 'fts-notification',
      renotify: true,
      data: { ...data, url }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = normalizeNotificationUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const target = new URL(targetUrl);
      for (const client of clientList) {
        try {
          const current = new URL(client.url);
          if (current.pathname === target.pathname && 'focus' in client) {
            if ('navigate' in client) return client.navigate(targetUrl).then(c => c ? c.focus() : client.focus());
            return client.focus();
          }
        } catch(e) {}
      }
      return clients.openWindow(targetUrl);
    })
  );
});
