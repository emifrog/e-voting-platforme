'use client'

import { useSessionRefresh } from '@/lib/hooks/use-session-refresh'

/**
 * Provider pour gérer l'expiration et le refresh automatique des sessions
 * À placer dans le layout principal pour couvrir toute l'application
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  useSessionRefresh()
  return <>{children}</>
}
