'use client'

/**
 * Provider CSRF qui injecte automatiquement le token dans tous les formulaires
 * et expose le token pour les requêtes fetch/axios
 */

import { createContext, useContext, useEffect, useState } from 'react'

interface CsrfContextValue {
  token: string | null
  isLoading: boolean
}

const CsrfContext = createContext<CsrfContextValue>({
  token: null,
  isLoading: true,
})

export function useCsrf() {
  const context = useContext(CsrfContext)
  if (!context) {
    throw new Error('useCsrf must be used within CsrfProvider')
  }
  return context
}

interface CsrfProviderProps {
  children: React.ReactNode
  initialToken?: string
}

export function CsrfProvider({ children, initialToken }: CsrfProviderProps) {
  const [token, setToken] = useState<string | null>(initialToken || null)
  const [isLoading, setIsLoading] = useState(!initialToken)

  useEffect(() => {
    // Récupérer le token CSRF au montage si non fourni
    if (!initialToken) {
      fetch('/api/csrf-token')
        .then((res) => res.json())
        .then((data) => {
          setToken(data.token)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Failed to fetch CSRF token:', error)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [initialToken])

  return (
    <CsrfContext.Provider value={{ token, isLoading }}>
      {children}
    </CsrfContext.Provider>
  )
}

/**
 * Composant pour injecter automatiquement le token CSRF dans un formulaire
 *
 * @example
 * <form action={myAction}>
 *   <CsrfInput />
 *   <input type="text" name="title" />
 *   <button type="submit">Submit</button>
 * </form>
 */
export function CsrfInput() {
  const { token } = useCsrf()

  if (!token) {
    return null
  }

  return <input type="hidden" name="csrf_token" value={token} />
}

/**
 * Hook pour obtenir le token CSRF à utiliser dans fetch/axios
 *
 * @example
 * const { token } = useCsrfToken()
 *
 * fetch('/api/vote', {
 *   method: 'POST',
 *   headers: {
 *     'x-csrf-token': token,
 *   },
 *   body: JSON.stringify(data)
 * })
 */
export function useCsrfToken() {
  const { token, isLoading } = useCsrf()
  return { token, isLoading }
}
