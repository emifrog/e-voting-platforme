/**
 * Service Worker pour les notifications push
 * Gère la réception et l'affichage des notifications
 */

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé')
  self.skipWaiting()
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé')
  event.waitUntil(self.clients.claim())
})

// Réception des notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue:', event)

  let notification = {
    title: 'E-Voting',
    body: 'Nouvelle notification',
    icon: '/logo.png',
    badge: '/badge.png',
    tag: 'evoting-notification',
    requireInteraction: false,
  }

  // Parser les données de la notification
  if (event.data) {
    try {
      const data = event.data.json()
      notification = {
        ...notification,
        ...data,
      }
    } catch (error) {
      console.error('Erreur parsing notification:', error)
      notification.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      data: notification.data || {},
    })
  )
})

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('Notification cliquée:', event.notification)

  event.notification.close()

  // Ouvrir l'app ou rediriger vers une URL spécifique
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Gestion des erreurs push
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changée:', event)

  // Réabonner automatiquement
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('Réabonnement réussi:', subscription)
        // TODO: Envoyer la nouvelle subscription au serveur
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
      })
  )
})
