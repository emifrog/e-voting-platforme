/**
 * Service de notifications en temps réel avec Supabase Realtime
 */

import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/lib/utils/toast'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type NotificationEvent =
  | 'election_started'
  | 'election_ended'
  | 'new_vote'
  | 'results_updated'
  | 'quorum_reached'

export interface RealtimeNotification {
  event: NotificationEvent
  payload: {
    electionId: string
    electionTitle: string
    message: string
    timestamp: string
    data?: any
  }
}

/**
 * S'abonne aux notifications en temps réel pour une élection
 */
export function subscribeToElectionUpdates(
  electionId: string,
  onNotification?: (notification: RealtimeNotification) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`election:${electionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'elections',
        filter: `id=eq.${electionId}`,
      },
      (payload) => {
        console.log('Election update:', payload)

        const election = payload.new as any

        // Déterminer le type d'événement
        let eventType: NotificationEvent
        let message: string

        if (election.status === 'open' && payload.old.status !== 'open') {
          eventType = 'election_started'
          message = `L'élection "${election.title}" a démarré !`
          showToast.info('Élection démarrée', message)
        } else if (election.status === 'closed' && payload.old.status !== 'closed') {
          eventType = 'election_ended'
          message = `L'élection "${election.title}" est terminée`
          showToast.success('Élection terminée', message)
        } else {
          eventType = 'results_updated'
          message = `L'élection "${election.title}" a été mise à jour`
          showToast.info('Mise à jour', message)
        }

        const notification: RealtimeNotification = {
          event: eventType,
          payload: {
            electionId: election.id,
            electionTitle: election.title,
            message,
            timestamp: new Date().toISOString(),
            data: election,
          },
        }

        onNotification?.(notification)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'votes',
        filter: `election_id=eq.${electionId}`,
      },
      (payload) => {
        console.log('New vote:', payload)

        const notification: RealtimeNotification = {
          event: 'new_vote',
          payload: {
            electionId,
            electionTitle: '',
            message: 'Un nouveau vote a été enregistré',
            timestamp: new Date().toISOString(),
            data: payload.new,
          },
        }

        onNotification?.(notification)
      }
    )
    .subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`)

      if (status === 'SUBSCRIBED') {
        showToast.success(
          'Temps réel activé',
          'Vous recevrez des notifications en direct'
        )
      } else if (status === 'CHANNEL_ERROR') {
        showToast.error(
          'Erreur de connexion',
          'Impossible de se connecter aux notifications en temps réel'
        )
      }
    })

  return channel
}

/**
 * S'abonne aux notifications pour toutes les élections de l'utilisateur
 */
export function subscribeToUserElections(
  userId: string,
  onNotification?: (notification: RealtimeNotification) => void
): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel(`user:${userId}:elections`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'elections',
        filter: `created_by=eq.${userId}`,
      },
      (payload) => {
        console.log('User election update:', payload)

        const election = payload.new as any
        let message = ''

        if (payload.eventType === 'INSERT') {
          message = `Nouvelle élection créée : "${election.title}"`
          showToast.success('Nouvelle élection', message)
        } else if (payload.eventType === 'UPDATE') {
          message = `Élection mise à jour : "${election.title}"`
          showToast.info('Mise à jour', message)
        } else if (payload.eventType === 'DELETE') {
          message = `Élection supprimée`
          showToast.warning('Élection supprimée', message)
        }

        const notification: RealtimeNotification = {
          event: 'results_updated',
          payload: {
            electionId: election?.id || '',
            electionTitle: election?.title || '',
            message,
            timestamp: new Date().toISOString(),
            data: election,
          },
        }

        onNotification?.(notification)
      }
    )
    .subscribe()

  return channel
}

/**
 * Se désabonne d'un canal de notifications
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await channel.unsubscribe()
  console.log('Unsubscribed from realtime channel')
}

/**
 * Hook React personnalisé pour les notifications en temps réel
 */
export function useRealtimeElection(
  electionId: string | null,
  onNotification?: (notification: RealtimeNotification) => void
) {
  if (typeof window === 'undefined') return null

  let channel: RealtimeChannel | null = null

  if (electionId) {
    channel = subscribeToElectionUpdates(electionId, onNotification)
  }

  // Cleanup
  return () => {
    if (channel) {
      unsubscribe(channel)
    }
  }
}
