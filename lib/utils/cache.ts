/**
 * Utilitaires de mise en cache pour améliorer les performances
 */

/**
 * Cache simple en mémoire avec expiration
 */
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expires: number }>()

  set(key: string, data: T, ttl: number = 60000): void {
    const expires = Date.now() + ttl
    this.cache.set(key, { data, expires })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    // Nettoyer les entrées expirées
    for (const [key, value] of this.cache.entries()) {
      if (Date.now() > value.expires) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }
}

// Instances de cache
export const electionCache = new MemoryCache<any>()
export const resultsCache = new MemoryCache<any>()
export const userCache = new MemoryCache<any>()

/**
 * Fonction de cache avec fonction de récupération
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000,
  cache: MemoryCache<T> = new MemoryCache<T>()
): Promise<T> {
  // Vérifier le cache
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Récupérer les données
  const data = await fetcher()

  // Mettre en cache
  cache.set(key, data, ttl)

  return data
}

/**
 * Invalide le cache pour une clé donnée
 */
export function invalidateCache(key: string, cache?: MemoryCache<any>): void {
  if (cache) {
    cache.delete(key)
  } else {
    // Invalider dans tous les caches
    electionCache.delete(key)
    resultsCache.delete(key)
    userCache.delete(key)
  }
}

/**
 * Invalide tout le cache
 */
export function clearAllCaches(): void {
  electionCache.clear()
  resultsCache.clear()
  userCache.clear()
}

/**
 * Debounce function pour limiter les appels
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function pour limiter la fréquence d'exécution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoization simple pour les fonctions pures
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)

    return result
  }) as T
}
