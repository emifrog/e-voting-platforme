/**
 * Service de notifications push (Web Push API)
 * Permet d'envoyer des notifications aux navigateurs
 */

/**
 * Demande la permission pour les notifications push
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Ce navigateur ne supporte pas les notifications')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  return await Notification.requestPermission()
}

/**
 * Vérifie si les notifications sont supportées et autorisées
 */
export function areNotificationsEnabled(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

/**
 * Enregistre un service worker pour les notifications push
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker enregistré:', registration)
    return registration
  } catch (error) {
    console.error('Erreur enregistrement Service Worker:', error)
    return null
  }
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    const applicationServerKey = urlBase64ToUint8Array(vapidKey)

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    })

    // Envoyer la subscription au serveur
    await saveSubscriptionToServer(subscription)

    return subscription
  } catch (error) {
    console.error('Erreur abonnement push:', error)
    return null
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return false
    }

    // Supprimer du serveur
    await removeSubscriptionFromServer(subscription)

    // Se désabonner
    await subscription.unsubscribe()

    return true
  } catch (error) {
    console.error('Erreur désabonnement push:', error)
    return false
  }
}

/**
 * Affiche une notification locale (pas de push serveur)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsEnabled()) {
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      throw new Error('Permission de notification refusée')
    }
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification(title, {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    ...options,
  })
}

/**
 * Envoie la subscription au serveur
 */
async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      throw new Error('Erreur sauvegarde subscription')
    }
  } catch (error) {
    console.error('Erreur sauvegarde subscription:', error)
  }
}

/**
 * Supprime la subscription du serveur
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    })

    if (!response.ok) {
      throw new Error('Erreur suppression subscription')
    }
  } catch (error) {
    console.error('Erreur suppression subscription:', error)
  }
}

/**
 * Convertit une clé VAPID base64 en Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Types de notifications d'événements
 */
export interface ElectionNotification {
  type: 'election_started' | 'election_closing_soon' | 'election_closed' | 'results_available'
  electionId: string
  title: string
  message: string
  url?: string
}

/**
 * Envoie une notification d'événement d'élection
 */
export async function notifyElectionEvent(
  notification: ElectionNotification
): Promise<void> {
  const icons: Record<ElectionNotification['type'], string> = {
    election_started: '▶️',
    election_closing_soon: '⏰',
    election_closed: '🔒',
    results_available: '📊',
  }

  await showLocalNotification(notification.title, {
    body: notification.message,
    tag: `election-${notification.electionId}`,
    data: {
      url: notification.url || `/elections/${notification.electionId}`,
    },
  })
}
