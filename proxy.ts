import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

// #region agent log
fetch('http://127.0.0.1:7892/ingest/1da48778-7d56-42fb-8eee-74a0bae3736c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f6821d'},body:JSON.stringify({sessionId:'f6821d',runId:'pre-debug',hypothesisId:'H1_proxy_module_loaded',location:'proxy.ts:1',message:'proxy.ts module loaded',data:{},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7892/ingest/1da48778-7d56-42fb-8eee-74a0bae3736c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f6821d'},body:JSON.stringify({sessionId:'f6821d',runId:'pre-debug',hypothesisId:'H1_proxy_called',location:'proxy.ts:8',message:'proxy() called',data:{pathname:request.nextUrl.pathname},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { pathname } = request.nextUrl

  // next-intl handles locale detection + URL rewriting/redirecting.
  const intlResponse = intlMiddleware(request)

  // Exclude public files and Next.js internals and APIs from Auth check.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return intlResponse
  }

  // Run your Supabase auth middleware next, then merge its headers/cookies
  // back into the next-intl response.
  const authResponse = await updateSession(request)

  // If auth middleware decided to redirect, ensure the locale prefix exists.
  if (
    authResponse.status >= 300 &&
    authResponse.status < 400 &&
    authResponse.headers.has('location')
  ) {
    const location = authResponse.headers.get('location')
    if (location) {
      const url = new URL(location, request.url)
      const currentLocaleMatch = pathname.match(/^\/(en|vi)(\/|$)/)
      const currentLocale = currentLocaleMatch
        ? currentLocaleMatch[1]
        : routing.defaultLocale

      if (!url.pathname.match(/^\/(en|vi)(\/|$)/)) {
        url.pathname = `/${currentLocale}${url.pathname === '/' ? '' : url.pathname}`
        authResponse.headers.set('location', url.toString())
      }
    }
    return authResponse
  }

  // Merge `x-user-context` header so server components can read it.
  authResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'x-user-context') {
      intlResponse.headers.set(key, value)
    }
  })

  // Append cookies set by auth middleware.
  const authSetCookies = authResponse.headers.getSetCookie()
  if (authSetCookies && authSetCookies.length > 0) {
    authSetCookies.forEach((cookieStr) => {
      intlResponse.headers.append('set-cookie', cookieStr)
    })
  }

  return intlResponse
}

export const config = {
  matcher: ['/', '/(en|vi)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
}