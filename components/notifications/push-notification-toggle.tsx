'use client'

/**
 * Toggle pour activer/désactiver les notifications push
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'
import {
  areNotificationsEnabled,
  requestNotificationPermission,
  registerPushServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/services/push-notifications'
import { toast } from 'sonner'

export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setSupported(false)
      return
    }

    setEnabled(areNotificationsEnabled())
  }, [])

  const handleToggle = async () => {
    setLoading(true)

    try {
      if (enabled) {
        // Désactiver
        const registration = await navigator.serviceWorker.ready
        const success = await unsubscribeFromPushNotifications(registration)

        if (success) {
          setEnabled(false)
          toast.success('Notifications désactivées', {
            description: 'Vous ne recevrez plus de notifications push',
          })
        } else {
          toast.error('Erreur', {
            description: 'Impossible de désactiver les notifications',
          })
        }
      } else {
        // Activer
        const permission = await requestNotificationPermission()

        if (permission !== 'granted') {
          toast.error('Permission refusée', {
            description: 'Veuillez autoriser les notifications dans votre navigateur',
          })
          setLoading(false)
          return
        }

        const registration = await registerPushServiceWorker()

        if (!registration) {
          toast.error('Erreur', {
            description: 'Service Worker non disponible',
          })
          setLoading(false)
          return
        }

        const subscription = await subscribeToPushNotifications(registration)

        if (subscription) {
          setEnabled(true)
          toast.success('Notifications activées !', {
            description: 'Vous recevrez des notifications pour vos élections',
          })
        } else {
          toast.error('Erreur', {
            description: 'Impossible d\'activer les notifications',
          })
        }
      }
    } catch (error) {
      console.error('Erreur toggle notifications:', error)
      toast.error('Erreur', {
        description: 'Une erreur est survenue',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-muted-foreground">Notifications Push</div>
          <div className="text-xs text-muted-foreground">
            Non supporté par votre navigateur
          </div>
        </div>
        <BellOff className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">Notifications Push</div>
        <div className="text-xs text-muted-foreground">
          Recevoir des alertes pour vos élections
        </div>
      </div>
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        className="gap-2"
      >
        {enabled ? (
          <>
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span>Activé</span>
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" aria-hidden="true" />
            <span>Désactivé</span>
          </>
        )}
      </Button>
    </div>
  )
}
