import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication check
const protectedPaths = ['/dashboard', '/elections', '/settings']
const authPaths = ['/login', '/register']

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip auth check for non-protected and non-auth paths
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (!isProtectedPath && !isAuthPath) {
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

  // Use getSession for faster response (cached), then verify with getUser only if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (session && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
