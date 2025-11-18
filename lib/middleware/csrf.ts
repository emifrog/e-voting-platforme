/**
 * Protection CSRF pour Server Actions Next.js 15
 *
 * Génère des tokens CSRF uniques par session et les valide
 * sur toutes les mutations (POST, PUT, DELETE)
 */

import { cookies, headers } from 'next/headers'
import { createServerError } from '@/lib/errors'
import crypto from 'crypto'

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

/**
 * Génère un token CSRF cryptographiquement sécurisé
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url')
  const cookieStore = await cookies()

  // Stocker le token dans un cookie httpOnly
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 heures
    path: '/',
  })

  return token
}

/**
 * Récupère le token CSRF actuel ou en génère un nouveau
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!token) {
    token = await generateCsrfToken()
  }

  return token
}

/**
 * Valide le token CSRF depuis les headers ou formData
 *
 * @throws AppError si le token est invalide ou manquant
 */
export async function validateCsrfToken(formData?: FormData): Promise<void> {
  const cookieStore = await cookies()
  const headersList = await headers()

  // Récupérer le token stocké
  const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!storedToken) {
    throw createServerError.validation(
      'csrf_token',
      'Token CSRF manquant. Veuillez rafraîchir la page.'
    )
  }

  // Récupérer le token fourni (header ou formData)
  let providedToken: string | null = null

  // 1. Vérifier dans les headers (pour fetch/axios)
  providedToken = headersList.get(CSRF_HEADER_NAME)

  // 2. Vérifier dans formData (pour formulaires HTML)
  if (!providedToken && formData) {
    providedToken = formData.get('csrf_token') as string | null
  }

  if (!providedToken) {
    throw createServerError.validation(
      'csrf_token',
      'Token CSRF non fourni. Requête bloquée.'
    )
  }

  // Comparer les tokens de manière sécurisée (timing-safe)
  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(providedToken)
  )

  if (!isValid) {
    throw createServerError.validation(
      'csrf_token',
      'Token CSRF invalide. Requête bloquée.'
    )
  }
}

/**
 * Wrapper pour Server Actions avec protection CSRF automatique
 *
 * @example
 * export const createElection = withCsrfProtection(async (formData: FormData) => {
 *   // Logic protégée par CSRF
 * })
 */
export function withCsrfProtection<T extends (formData: FormData, ...args: any[]) => Promise<any>>(
  action: T
): T {
  return (async (formData: FormData, ...args: any[]) => {
    await validateCsrfToken(formData)
    return await action(formData, ...args)
  }) as T
}

/**
 * Hook côté client pour obtenir le token CSRF
 * À utiliser dans les composants pour l'ajouter aux requêtes
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return await getCsrfToken()
}

/**
 * Middleware pour vérifier les requêtes API
 * À utiliser dans les API routes
 */
export async function csrfMiddleware(request: Request): Promise<Response | null> {
  const method = request.method

  // Ignorer les méthodes GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null
  }

  try {
    const cookieStore = await cookies()
    const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value

    if (!storedToken) {
      return new Response(
        JSON.stringify({
          error: 'Token CSRF manquant',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const providedToken = request.headers.get(CSRF_HEADER_NAME)

    if (!providedToken) {
      return new Response(
        JSON.stringify({
          error: 'Token CSRF non fourni',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(providedToken)
    )

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: 'Token CSRF invalide',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return null // Validation réussie
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Erreur de validation CSRF',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
