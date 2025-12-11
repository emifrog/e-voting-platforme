/**
 * Service de rate limiting avec Upstash Redis
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialiser Redis uniquement si les variables d'environnement sont définies
let redis: Redis | null = null
let loginRateLimiter: Ratelimit | null = null
let voteRateLimiter: Ratelimit | null = null
let apiRateLimiter: Ratelimit | null = null
let twoFactorRateLimiter: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  /**
   * Rate limiter pour les tentatives de login
   * 5 tentatives par heure par IP
   */
  loginRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:login',
  })

  /**
   * Rate limiter pour le vote
   * 10 votes par minute par IP (protection anti-spam)
   */
  voteRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:vote',
  })

  /**
   * Rate limiter général pour les API
   * 100 requêtes par minute par IP
   */
  apiRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  })

  /**
   * Rate limiter pour la vérification 2FA
   * 10 tentatives par 5 minutes (protection brute force)
   */
  twoFactorRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '5 m'),
    analytics: true,
    prefix: 'ratelimit:2fa',
  })
}

/**
 * Vérifie si une requête de login est autorisée
 */
export async function checkLoginRateLimit(
  identifier: string,
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!loginRateLimiter) {
    // Si Redis n'est pas configuré, autoriser toutes les requêtes
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 3600000,
    }
  }

  const { success, limit, remaining, reset } = await loginRateLimiter.limit(
    identifier,
  )

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Vérifie si une requête de vote est autorisée
 */
export async function checkVoteRateLimit(
  identifier: string,
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!voteRateLimiter) {
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 60000,
    }
  }

  const { success, limit, remaining, reset } = await voteRateLimiter.limit(
    identifier,
  )

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Vérifie si une requête API est autorisée
 */
export async function checkAPIRateLimit(
  identifier: string,
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!apiRateLimiter) {
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 60000,
    }
  }

  const { success, limit, remaining, reset } = await apiRateLimiter.limit(
    identifier,
  )

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Vérifie si une tentative 2FA est autorisée
 */
export async function check2FARateLimit(
  identifier: string,
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!twoFactorRateLimiter) {
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 300000,
    }
  }

  const { success, limit, remaining, reset } = await twoFactorRateLimiter.limit(
    identifier,
  )

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Réinitialise le compteur de rate limit pour un identifiant donné
 */
export async function resetRateLimit(
  prefix: string,
  identifier: string,
): Promise<void> {
  if (!redis) return

  await redis.del(`${prefix}:${identifier}`)
}

/**
 * Obtient le nombre de tentatives restantes
 */
export async function getRateLimitInfo(
  prefix: string,
  identifier: string,
): Promise<{ count: number; ttl: number } | null> {
  if (!redis) return null

  const key = `${prefix}:${identifier}`
  const count = await redis.get<number>(key)
  const ttl = await redis.ttl(key)

  return {
    count: count || 0,
    ttl,
  }
}
