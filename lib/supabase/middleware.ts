import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth', '/unauthorized']

// Cache duration for user session metadata (5 minutes)
const SESSION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

// Session secret for HMAC signing
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-development-secret-not-for-production'

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  WARNING: SESSION_SECRET not set in production! Cookie tampering is possible.')
}

/**
 * User session cache structure stored in cookie
 */
interface CachedUserSession {
  userId: string
  email: string
  role: string
  cachedAt: number // timestamp
}

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
  '/earnings',
  '/chats',
  '/availability',
  '/notifications',
  '/book-appointment',
]

// Admin-only sub-routes within the dashboard
const ADMIN_ONLY_PATHS = ['/users', '/experts', '/analytics', '/posts', '/meditations']

/**
 * Sign data with HMAC-SHA256
 * Prevents cookie tampering by creating a cryptographic signature
 */
function signData(data: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex')
}

/**
 * Verify HMAC signature using timing-safe comparison
 * Prevents timing attacks
 */
function verifySignature(data: string, signature: string): boolean {
  const expected = signData(data)
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    // Invalid signature format
    return false
  }
}

/**
 * Try to read cached session from cookie with signature verification
 */
function getCachedSession(request: NextRequest): CachedUserSession | null {
  const sessionCookie = request.cookies.get('user_session_cache')
  const signatureCookie = request.cookies.get('user_session_sig')
  
  if (!sessionCookie || !signatureCookie) return null

  try {
    const data = sessionCookie.value
    const signature = signatureCookie.value
    
    // Verify signature before trusting data
    if (!verifySignature(data, signature)) {
      console.warn('[Middleware] Invalid session signature - possible tampering attempt')
      return null
    }
    
    const cached: CachedUserSession = JSON.parse(data)
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - cached.cachedAt < SESSION_CACHE_TTL) {
      return cached
    }
    
    // Cache expired
    return null
  } catch {
    // Invalid JSON or parse error
    return null
  }
}

/**
 * Store session in cache cookie with HMAC signature
 */
function setCachedSession(
  response: NextResponse,
  userId: string,
  email: string,
  role: string
): void {
  const cached: CachedUserSession = {
    userId,
    email,
    role,
    cachedAt: Date.now(),
  }

  const data = JSON.stringify(cached)
  const signature = signData(data)
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days (but internally checks cachedAt)
    path: '/',
  }

  response.cookies.set('user_session_cache', data, cookieOptions)
  response.cookies.set('user_session_sig', signature, cookieOptions)
}

/**
 * Wrap a promise with a timeout
 * Prevents hanging indefinitely if Supabase is slow or down
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  )
  return Promise.race([promise, timeout])
}

/**
 * Authentication and authorization middleware
 * 
 * Performance optimizations:
 * - Caches user session for 5 minutes to avoid repeated DB queries
 * - Passes user context via header to Server Components
 * - Logs timing in development mode
 * 
 * Handles:
 * - Session validation with token refresh
 * - User role fetching from database (cached)
 * - Role-based access control (RBAC)
 * - Session management with cookies
 */
export async function updateSession(request: NextRequest) {
  const startTime = performance.now()
  const { pathname } = request.nextUrl

  // Helper to redirect
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // Helper to log performance in development
  const logPerformance = (label: string, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] ${label}: ${duration.toFixed(2)}ms`)
    }
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

  // ── OPTIMIZATION: Check cached session first ────────────────────────────
  const cachedSession = getCachedSession(request)
  
  if (cachedSession) {
    const cacheCheckTime = performance.now() - startTime
    logPerformance('Cache hit', cacheCheckTime)

    // Verify user still has valid Supabase session (quick check, no DB query)
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
      // Quick auth check (verifies JWT, no DB query)
      // Validate session with Supabase auth (with timeout)
      const { data: { user }, error: authError } = await withTimeout(
        supabase.auth.getUser(),
        3000, // 3 second timeout
        'Supabase auth timeout - taking too long to respond'
      )

      if (!authError && user && user.id === cachedSession.userId) {
        // Session is valid, use cached data
        const { userId, email, role } = cachedSession

        // Perform role-based access control
        const isDashboardRoute = DASHBOARD_PATHS.some(p =>
          p === '/' ? pathname === '/' : pathname.startsWith(p)
        )

        if (isDashboardRoute) {
          if (role !== 'admin' && role !== 'expert') {
            if (pathname.startsWith('/api')) {
              return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
            return redirectTo('/unauthorized')
          }

          const isAdminOnly = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
          if (isAdminOnly && role !== 'admin') {
            if (pathname.startsWith('/api')) {
              return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
            return redirectTo('/unauthorized')
          }
        }

        // Pass user context to Server Components via header
        supabaseResponse.headers.set(
          'x-user-context',
          Buffer.from(JSON.stringify({ id: userId, email, role })).toString('base64')
        )

        // Keep role cookie (backward compatibility)
        supabaseResponse.cookies.set('user_role', role, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })

        const totalTime = performance.now() - startTime
        logPerformance('Total (cached)', totalTime)

        return supabaseResponse
      }
    } catch (err) {
      // Cache validation failed, fall through to full auth
      console.log('[Middleware] Cache validation failed, performing full auth')
    }
  }

  // ── FULL AUTHENTICATION: Cache miss or validation failed ────────────────
  const fullAuthStartTime = performance.now()
  logPerformance('Cache miss, performing full auth', fullAuthStartTime - startTime)

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
    const authStartTime = performance.now()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    logPerformance('Auth check', performance.now() - authStartTime)

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
    const dbQueryStartTime = performance.now()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single()
    
    logPerformance('DB query', performance.now() - dbQueryStartTime)

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

    // Step 5: Cache session data for future requests
    setCachedSession(supabaseResponse, user.id, userData.email, userRole)

    // Step 6: Pass user context to Server Components via header
    supabaseResponse.headers.set(
      'x-user-context',
      Buffer.from(JSON.stringify({ id: user.id, email: userData.email, role: userRole })).toString('base64')
    )

    // Step 7: Store role in cookie for backward compatibility
    supabaseResponse.cookies.set('user_role', userRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    const totalTime = performance.now() - startTime
    logPerformance('Total (full auth)', totalTime)

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
