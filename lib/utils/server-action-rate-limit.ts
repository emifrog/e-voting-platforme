import { headers } from 'next/headers'
import { checkLoginRateLimit, check2FARateLimit } from '@/lib/services/rate-limit'

/**
 * Helper pour appliquer le rate limiting dans les Server Actions
 * Retourne true si rate limit dépassé, false sinon
 */
export async function checkRateLimitForAction(type: 'login' | '2fa'): Promise<{
  limited: boolean
  remaining?: number
  reset?: Date
}> {
  try {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    let result
    if (type === 'login') {
      result = await checkLoginRateLimit(ip)
    } else if (type === '2fa') {
      result = await check2FARateLimit(ip)
    } else {
      return { limited: false }
    }

    return {
      limited: !result.success,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // En cas d'erreur, on laisse passer pour ne pas bloquer l'app
    return { limited: false }
  }
}
