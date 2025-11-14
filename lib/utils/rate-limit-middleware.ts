/**
 * Middleware helper pour rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  checkAPIRateLimit,
  checkVoteRateLimit,
  checkLoginRateLimit,
  check2FARateLimit,
} from '@/lib/services/rate-limit'

export type RateLimitType = 'api' | 'vote' | 'login' | '2fa'

/**
 * Obtient l'identifiant pour le rate limiting (IP address)
 */
export function getRateLimitIdentifier(request: NextRequest): string {
  // Essayer d'obtenir l'IP réelle depuis les headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  return (
    cfConnectingIp ||
    realIp ||
    forwardedFor?.split(',')[0] ||
    request.ip ||
    'unknown'
  )
}

/**
 * Applique le rate limiting à une requête
 */
export async function applyRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(request)

  let result: {
    success: boolean
    limit: number
    remaining: number
    reset: number
  }

  switch (type) {
    case 'login':
      result = await checkLoginRateLimit(identifier)
      break
    case 'vote':
      result = await checkVoteRateLimit(identifier)
      break
    case '2fa':
      result = await check2FARateLimit(identifier)
      break
    default:
      result = await checkAPIRateLimit(identifier)
  }

  // Ajouter les headers de rate limit à toutes les réponses
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: getRateLimitErrorMessage(type),
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers,
      },
    )
  }

  return null // Pas de rate limit atteint, continuer
}

/**
 * Messages d'erreur personnalisés selon le type
 */
function getRateLimitErrorMessage(type: RateLimitType): string {
  switch (type) {
    case 'login':
      return 'Trop de tentatives de connexion. Veuillez réessayer dans une heure.'
    case 'vote':
      return 'Trop de tentatives de vote. Veuillez patienter quelques instants.'
    case '2fa':
      return 'Trop de tentatives de vérification 2FA. Veuillez réessayer dans 5 minutes.'
    default:
      return 'Trop de requêtes. Veuillez réessayer dans quelques instants.'
  }
}

/**
 * Wrapper pour protéger une API Route avec rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api',
) {
  return async (request: NextRequest) => {
    const rateLimitResponse = await applyRateLimit(request, type)

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    return handler(request)
  }
}
