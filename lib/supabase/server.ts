import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          safeCookieMutation(() => cookieStore.set({ name, value, ...options }))
        },
        remove(name, options) {
          safeCookieMutation(() => cookieStore.set({ name, value: '', ...options, maxAge: 0 }))
        },
      },
    }
  )

  function safeCookieMutation(mutate: () => void) {
    try {
      mutate()
    } catch {
      // Ignore mutations triggered from Server Components; middleware keeps sessions fresh.
    }
  }
}

// Alias pour cohérence avec les anciens imports
export { createClient as createServerClient }
