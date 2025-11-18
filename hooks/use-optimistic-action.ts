/**
 * Hook pour gérer les actions optimistes (Optimistic UI)
 * Affiche immédiatement le changement UI avant confirmation serveur
 */

import { useOptimistic, useTransition } from 'react'

interface UseOptimisticActionOptions<T, A> {
  /**
   * Fonction qui met à jour l'état de façon optimiste
   */
  updateFn: (state: T, action: A) => T
  /**
   * Fonction qui effectue l'action serveur
   */
  action: (payload: A) => Promise<{ success: boolean; error?: string }>
  /**
   * Callback en cas de succès
   */
  onSuccess?: () => void
  /**
   * Callback en cas d'erreur
   */
  onError?: (error: string) => void
}

export function useOptimisticAction<T, A>(
  initialState: T,
  options: UseOptimisticActionOptions<T, A>
) {
  const [optimisticState, addOptimistic] = useOptimistic(
    initialState,
    options.updateFn
  )
  const [isPending, startTransition] = useTransition()

  const executeAction = async (payload: A) => {
    // 1. Mise à jour optimiste immédiate
    startTransition(() => {
      addOptimistic(payload)
    })

    // 2. Action serveur
    const result = await options.action(payload)

    // 3. Gestion du résultat
    if (result.success) {
      options.onSuccess?.()
    } else {
      // En cas d'erreur, React reviendra automatiquement à l'état précédent
      options.onError?.(result.error || 'Une erreur est survenue')
    }

    return result
  }

  return {
    state: optimisticState,
    isPending,
    execute: executeAction,
  }
}
