self.addEventListener('push', function (event) {
  let data = {
    title: 'Harmony Garden & Estate',
    body: 'New notification received',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'Harmony Garden & Estate', body: event.data.text() }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/alerts' },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/alerts'
  event.waitUntil(clients.openWindow(url))
})