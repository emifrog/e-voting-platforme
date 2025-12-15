import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Only these routes require authentication check via Supabase
const protectedPaths = ['/dashboard', '/elections', '/settings']

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only check auth for protected paths - skip everything else for performance
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          updateSupabaseCookies(name, value, options)
        },
        remove(name, options) {
          updateSupabaseCookies(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  function updateSupabaseCookies(name: string, value: string, options?: CookieOptions) {
    request.cookies.set({
      name,
      value,
      ...options,
    })
    supabaseResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    supabaseResponse.cookies.set({
      name,
      value,
      ...options,
    })
  }

  // Use getSession for faster response (cached)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
