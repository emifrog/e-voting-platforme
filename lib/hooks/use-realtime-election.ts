'use client'

import { useEffect, useState } from 'react'
import { subscribeToElectionUpdates, unsubscribe, type RealtimeNotification } from '@/lib/services/realtime-notifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook pour s'abonner aux mises à jour en temps réel d'une élection
 */
export function useRealtimeElection(electionId: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!electionId) return

    let channel: RealtimeChannel

    const handleNotification = (notification: RealtimeNotification) => {
      setNotifications((prev) => [...prev, notification])
    }

    // S'abonner
    channel = subscribeToElectionUpdates(electionId, handleNotification)

    // Vérifier le statut de connexion
    const checkStatus = setInterval(() => {
      if (channel) {
        setIsConnected(channel.state === 'joined')
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(checkStatus)
      if (channel) {
        unsubscribe(channel)
        setIsConnected(false)
      }
    }
  }, [electionId])

  return {
    notifications,
    isConnected,
    clearNotifications: () => setNotifications([]),
  }
}
