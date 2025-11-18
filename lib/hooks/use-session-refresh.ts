'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook pour gérer automatiquement le refresh des sessions
 * Supabase gère déjà le refresh automatique, mais ce hook permet:
 * - De détecter les sessions expirées
 * - De rediriger vers le login si nécessaire
 * - De logger les événements d'expiration
 */
export function useSessionRefresh() {
  useEffect(() => {
    const supabase = createClient()

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Session expirée
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Session token refreshed successfully')
      }

      // Session expirée et impossible de refresh
      if (event === 'SIGNED_OUT') {
        console.log('🔒 Session expired, redirecting to login')
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true'
        }
      }

      // Erreur lors du refresh
      if (event === 'USER_UPDATED' && !session) {
        console.log('⚠️ Session refresh failed')
      }
    })

    // Vérifier périodiquement la session (toutes les 5 minutes)
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Error checking session:', error)
        return
      }

      if (!session) {
        console.log('🔒 No active session found')
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true'
        }
        return
      }

      // Vérifier si la session expire bientôt (dans moins de 10 minutes)
      const expiresAt = session.expires_at
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
        if (expiresIn < 600) {
          // Moins de 10 minutes
          console.log(`⏰ Session expires in ${Math.floor(expiresIn / 60)} minutes, refreshing...`)
          await supabase.auth.refreshSession()
        }
      }
    }

    // Vérifier immédiatement
    checkSession()

    // Puis vérifier toutes les 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])
}
