// sw-push.js — Custom service worker for push notification events.
// Runs alongside ngsw-worker.js which handles caching.
// Registered manually in main.ts via navigator.serviceWorker.register('/sw-push.js').

// Listens for incoming push notifications sent by the backend cron job.
// event.waitUntil ensures the notification is shown before the worker sleeps.
self.addEventListener('push', (event) => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: '/' },
    }),
  );
});

// Handles notification tap — brings the app into focus or opens a new window.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open in a tab, focus it
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow('/');
    }),
  );
});
