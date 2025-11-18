/**
 * Middleware pour gérer les erreurs dans les Server Actions
 */

import { AppError, logError, normalizeError } from '@/lib/errors'

/**
 * Wrapper pour les Server Actions qui gère automatiquement les erreurs
 *
 * @example
 * export const myAction = withErrorHandling(async (formData: FormData) => {
 *   // Your action logic
 *   throw createElectionsError.notFound('123')
 * })
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await action(...args)
    } catch (error) {
      const appError = normalizeError(error)
      logError(appError)

      // Retourner une réponse d'erreur structurée
      return {
        success: false,
        error: {
          category: appError.category,
          code: appError.code,
          message: appError.userMessage,
          statusCode: appError.statusCode,
        },
      }
    }
  }) as T
}

/**
 * Type pour les réponses de Server Actions standardisées
 */
export type ActionResponse<T = any> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: {
        category: string
        code: string
        message: string
        statusCode: number
      }
    }

/**
 * Helper pour créer une réponse de succès
 */
export function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Helper pour créer une réponse d'erreur
 */
export function createErrorResponse(error: AppError): ActionResponse {
  return {
    success: false,
    error: {
      category: error.category,
      code: error.code,
      message: error.userMessage,
      statusCode: error.statusCode,
    },
  }
}
