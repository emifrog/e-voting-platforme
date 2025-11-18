/**
 * Cache pour les résultats d'élections closes
 * Utilise Next.js unstable_cache pour mettre en cache les résultats immuables
 */

import { unstable_cache } from 'next/cache'
import { calculateResults } from '@/lib/services/results'
import { createClient } from '@/lib/supabase/server'

/**
 * Récupère les résultats d'une élection avec cache
 * Cache indéfiniment si l'élection est close/archived
 */
export const getCachedResults = unstable_cache(
  async (electionId: string) => {
    return await calculateResults(electionId)
  },
  ['election-results'],
  {
    tags: (electionId) => [`election-${electionId}-results`],
    revalidate: false, // Pas de revalidation automatique pour élections closes
  }
)

/**
 * Récupère les résultats avec cache intelligent
 * - Élections closes/archived: cache permanent
 * - Élections active: pas de cache (données changeantes)
 */
export async function getResultsWithSmartCache(electionId: string) {
  const supabase = await createClient()

  // Vérifier le statut de l'élection
  const { data: election } = await supabase
    .from('elections')
    .select('id, status')
    .eq('id', electionId)
    .single()

  if (!election) {
    return null
  }

  // Si l'élection est close ou archived, utiliser le cache
  if (election.status === 'closed' || election.status === 'archived') {
    return await getCachedResults(electionId)
  }

  // Sinon, calculer en temps réel (élection active)
  return await calculateResults(electionId)
}

/**
 * Invalide le cache des résultats d'une élection
 * À appeler quand une élection passe à l'état "closed"
 */
export async function invalidateResultsCache(electionId: string) {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(`election-${electionId}-results`)
}

/**
 * Précharge les résultats dans le cache pour une élection close
 * Utile après la fermeture d'une élection
 */
export async function preloadResultsCache(electionId: string) {
  const supabase = await createClient()

  const { data: election } = await supabase
    .from('elections')
    .select('status')
    .eq('id', electionId)
    .single()

  if (election?.status === 'closed' || election?.status === 'archived') {
    // Forcer le calcul et la mise en cache
    await getCachedResults(electionId)
  }
}
