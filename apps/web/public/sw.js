// public/sw.js
// Service worker for Volta push notifications.
// Place at: apps/web/public/sw.js

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch {}

  const title   = data.title ?? 'Volta'
  const options = {
    body:    data.body   ?? '',
    icon:    data.icon   ?? '/icon-192.png',
    badge:   '/badge-72.png',
    tag:     data.url    ?? 'volta-notification',
    renotify: true,
    data:    { url: data.url ?? '/dashboard' },
    actions: [{ action: 'open', title: 'View' }],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus an existing tab if it's already open
      for (const client of list) {
        const clientUrl = new URL(client.url)
        if (clientUrl.pathname === new URL(targetUrl, self.location.origin).pathname) {
          return client.focus()
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(targetUrl)
    })
  )
})
