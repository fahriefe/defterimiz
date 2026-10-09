// Defterimiz bildirim servisi: sunucudan "push" gelince bildirimi gösterir.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Aynı etiketli bildirimler birbirinin yerine geçer; sayıyı biz tutup "3 şey bıraktı" diye gösteriyoruz.
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const existing = await self.registration.getNotifications({ tag: 'defterimiz' });
    const n = existing.reduce((sum, x) => sum + ((x.data && x.data.count) || 1), 0) + 1;
    existing.forEach((x) => x.close());
    await self.registration.showNotification('Defterimiz 💌', {
      body: n > 1 ? `Eşin sana ${n} şey bıraktı 🥰` : 'Eşin sana bir şey bıraktı, bak istersen 🥰',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'defterimiz',
      renotify: true,
      data: { count: n },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('/');
    }),
  );
});
