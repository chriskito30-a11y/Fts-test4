const CACHE = 'fts-v14-auth-android-fix';
const FILES = [
  './manifest.json',
  './assets/img/fts192.png',
  './assets/img/fts512.png',
  './assets/css/fts.css',
  './assets/css/fts-chat.css',
  './assets/js/fts-utils.js',
  './assets/js/fts-firebase.js',
  './assets/js/fts-pwa.js',
  './auth.html',
  './index.html',
  './membres.html',
  './forum.html',
  './messages.html',
  './profs.html'
];

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
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'FTS_SW_ACTIVATED' }));
    });
});


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
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
