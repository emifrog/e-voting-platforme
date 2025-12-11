/**
 * Rate Limiter basé sur une Map en mémoire
 * Pour une solution en production, utiliser Upstash Redis ou Vercel KV
 */

import { AppError, ErrorCategory, ErrorCode } from '@/lib/errors'

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Nettoyer les entrées expirées toutes les minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key)
      }
    }
  }

  /**
   * Vérifie si une clé a dépassé la limite
   * @param key - Identifiant unique (ex: IP, userId, email)
   * @param max - Nombre maximum de requêtes
   * @param windowMs - Fenêtre de temps en millisecondes
   * @returns true si la limite est dépassée
   */
  isRateLimited(key: string, max: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || entry.resetAt < now) {
      // Nouvelle entrée ou expirée
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return false
    }

    // Incrémenter le compteur
    entry.count++

    if (entry.count > max) {
      return true
    }

    return false
  }

  /**
   * Obtient le temps restant avant réinitialisation (en secondes)
   */
  getRetryAfter(key: string): number {
    const entry = this.limits.get(key)
    if (!entry) return 0

    const now = Date.now()
    const remainingMs = entry.resetAt - now

    return Math.ceil(remainingMs / 1000)
  }

  /**
   * Réinitialise manuellement une clé
   */
  reset(key: string) {
    this.limits.delete(key)
  }

  /**
   * Nettoie toutes les entrées
   */
  clear() {
    this.limits.clear()
  }

  /**
   * Arrête le cleanup automatique
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Instance singleton
const rateLimiter = new RateLimiter()

/**
 * Configuration des limites par type d'opération
 */
export const RATE_LIMITS = {
  // Authentification
  LOGIN: { max: 5, windowMs: 60 * 1000 }, // 5 tentatives/minute
  REGISTER: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 inscriptions/heure
  PASSWORD_RESET: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 resets/heure

  // Votes
  VOTE_CAST: { max: 1, windowMs: 60 * 1000 }, // 1 vote/minute (sécurité supplémentaire)
  VOTE_CHECK: { max: 10, windowMs: 60 * 1000 }, // 10 vérifications/minute

  // Inscriptions électeurs
  VOTER_REGISTRATION: { max: 10, windowMs: 60 * 1000 }, // 10 inscriptions/minute

  // Élections
  ELECTION_CREATE: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 créations/heure
  ELECTION_UPDATE: { max: 20, windowMs: 60 * 1000 }, // 20 modifications/minute
  ELECTION_DELETE: { max: 3, windowMs: 60 * 1000 }, // 3 suppressions/minute

  // Emails
  EMAIL_SEND: { max: 10, windowMs: 60 * 60 * 1000 }, // 10 emails/heure
  EMAIL_BULK: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 envois groupés/heure

  // API générale
  API_GENERAL: { max: 100, windowMs: 60 * 1000 }, // 100 requêtes/minute
} as const

/**
 * Vérifie le rate limit et lève une erreur si dépassé
 *
 * @example
 * // Dans une Server Action
 * await checkRateLimit('login', email)
 */
export async function checkRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<void> {
  const { max, windowMs } = RATE_LIMITS[type]
  const key = `${type}:${identifier}`

  if (rateLimiter.isRateLimited(key, max, windowMs)) {
    const retryAfter = rateLimiter.getRetryAfter(key)

    // Choisir le type d'erreur approprié
    if (type.startsWith('LOGIN') || type.startsWith('REGISTER')) {
      throw new AppError({
        category: ErrorCategory.AUTH,
        code: ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
        message: `Rate limit dépassé pour ${type}: ${identifier}`,
        userMessage: `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`,
        statusCode: 429,
        metadata: { type, identifier, retryAfter },
      })
    } else if (type.startsWith('VOTE')) {
      throw new AppError({
        category: ErrorCategory.VOTING,
        code: ErrorCode.VOTING_RATE_LIMIT_EXCEEDED,
        message: `Rate limit dépassé pour ${type}: ${identifier}`,
        userMessage: 'Trop de tentatives. Veuillez patienter.',
        statusCode: 429,
        metadata: { type, identifier, retryAfter },
      })
    } else if (type.startsWith('EMAIL')) {
      throw new AppError({
        category: ErrorCategory.EMAIL,
        code: ErrorCode.EMAIL_RATE_LIMIT_EXCEEDED,
        message: `Rate limit dépassé pour ${type}: ${identifier}`,
        userMessage: "Trop d'emails envoyés. Veuillez patienter.",
        statusCode: 429,
        metadata: { type, identifier, retryAfter },
      })
    } else {
      throw new AppError({
        category: ErrorCategory.SERVER,
        code: ErrorCode.SERVER_INTERNAL_ERROR,
        message: `Rate limit dépassé pour ${type}: ${identifier}`,
        userMessage: 'Trop de requêtes. Veuillez patienter.',
        statusCode: 429,
        metadata: { type, identifier, retryAfter },
      })
    }
  }
}

/**
 * Wrapper pour Server Actions avec rate limiting automatique
 *
 * @example
 * export const loginAction = withRateLimit('LOGIN', (formData) => formData.get('email') as string)(
 *   async (formData: FormData) => {
 *     // Logic
 *   }
 * )
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  type: keyof typeof RATE_LIMITS,
  getIdentifier: (...args: Parameters<T>) => string
) {
  return (action: T): T => {
    return (async (...args: Parameters<T>) => {
      const identifier = getIdentifier(...args)
      await checkRateLimit(type, identifier)
      return await action(...args)
    }) as T
  }
}

/**
 * Réinitialise le rate limit pour un identifiant (à utiliser avec précaution)
 */
export function resetRateLimit(type: keyof typeof RATE_LIMITS, identifier: string) {
  const key = `${type}:${identifier}`
  rateLimiter.reset(key)
}

/**
 * Obtient les informations de rate limit pour un identifiant
 */
export function getRateLimitInfo(type: keyof typeof RATE_LIMITS, identifier: string) {
  const key = `${type}:${identifier}`
  const { max, windowMs } = RATE_LIMITS[type]
  const retryAfter = rateLimiter.getRetryAfter(key)

  return {
    limit: max,
    windowMs,
    retryAfter,
    isLimited: retryAfter > 0,
  }
}

export { rateLimiter }
