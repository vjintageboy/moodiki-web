import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth', '/unauthorized']

// Dashboard routes served by the (dashboard) route group
// These render at '/', '/analytics', etc. (no /dashboard prefix)
const DASHBOARD_PATHS = [
  '/',
  '/analytics',
  '/appointments',
  '/experts',
  '/meditations',
  '/posts',
  '/settings',
  '/users',
]

// Admin-only sub-routes within the dashboard
const ADMIN_ONLY_PATHS = ['/users', '/experts', '/analytics']

/**
 * Authentication and authorization middleware
 * Handles:
 * - Session validation with token refresh
 * - User role fetching from database
 * - Role-based access control (RBAC)
 * - Session management with cookies
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Helper to redirect
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Always allow public routes immediately (no Supabase call needed)
  if (isPublicRoute) {
    return NextResponse.next({ request })
  }

  // Build Supabase client
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, redirect to login
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Middleware] Missing Supabase environment variables')
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return redirectTo('/login')
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    // Step 1: Check authentication status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Middleware] Auth error:', authError.message)
    }

    // Step 2: Redirect unauthenticated users to login
    if (!user) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
      }
      return redirectTo('/login')
    }

    // Step 3: Fetch user role from DB
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Middleware] Error fetching user profile:', userError)
      // Auth user exists but no profile → force logout via redirect to login
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      return redirectTo('/login')
    }

    const userRole: string = userData.role

    // Step 4: Role-based access for dashboard paths
    const isDashboardRoute = DASHBOARD_PATHS.some(p =>
      p === '/' ? pathname === '/' : pathname.startsWith(p)
    )

    if (isDashboardRoute) {
      // Only admin and expert can access the dashboard
      if (userRole !== 'admin' && userRole !== 'expert') {
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        return redirectTo('/unauthorized')
      }

      // Admin-only paths
      const isAdminOnly = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
      if (isAdminOnly && userRole !== 'admin') {
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
        return redirectTo('/unauthorized')
      }
    }

    // Step 5: Store role in cookie for quick client-side access
    supabaseResponse.cookies.set('user_role', userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return supabaseResponse
  } catch (err) {
    // If anything throws (e.g. network issue, bad Supabase config),
    // redirect to login so users are never stuck on a blank/loading screen
    console.error('[Middleware] Unexpected error:', err)
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return redirectTo('/login')
  }
}
