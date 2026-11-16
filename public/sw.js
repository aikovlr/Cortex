// =========================================================================
// Cortex — Service Worker para Notificações Push e PWA
// =========================================================================

self.addEventListener('install', (event) => {
  // Ativa imediatamente o novo service worker sem esperar que as abas fechem
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume o controle de todas as páginas abertas no escopo
  event.waitUntil(self.clients.claim());
});

// Manipulação do evento de Push (Web Push API / FCM / APNs)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Cortex',
    body: 'Você possui uma nova notificação no Cortex.',
    link: '/minhas-tarefas',
    tag: 'cortex-notification',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: '/logo.png',
    badge: '/favicon.ico',
    tag: data.tag || 'cortex-notification',
    data: {
      link: data.link || '/minhas-tarefas',
      dateOfArrival: Date.now(),
    },
    vibrate: [150, 50, 150],
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cortex', notificationOptions)
  );
});

// Manipulação do clique na notificação nativa do sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetLink =
    (event.notification.data && event.notification.data.link) || '/minhas-tarefas';

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Se já houver uma janela/aba do Cortex aberta, foca nela e navega para o link
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetLink) {
              return client.navigate(targetLink);
            }
            return;
          }
        }
        // Se não houver janela aberta, abre uma nova
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetLink);
        }
      })
  );
});
