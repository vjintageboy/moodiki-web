import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Create an explicit response from next-intl, which handles locale detection and rewrites.
  const intlResponse = intlMiddleware(req);

  // Exclude public files and APIs from running Auth check
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return intlResponse;
  }

  // We want to pass the request to Supabase middleware.
  // Because updateSession is built to intercept the raw request, we run it first.
  const authResponse = await updateSession(req);

  // If the auth middleware decided to redirect (e.g. to /login),
  // we need to make sure the redirect URL includes the locale.
  if (authResponse.status >= 300 && authResponse.status < 400 && authResponse.headers.has('location')) {
    const location = authResponse.headers.get('location');
    if (location) {
      const url = new URL(location);
      // The `updateSession` might return something like `/login`. We need `/[locale]/login`.
      const currentLocaleMatch = pathname.match(/^\/(en|vi)(\/|$)/);
      const currentLocale = currentLocaleMatch ? currentLocaleMatch[1] : routing.defaultLocale;

      // Check if it already has a locale
      if (!url.pathname.match(/^\/(en|vi)(\/|$)/)) {
        url.pathname = `/${currentLocale}${url.pathname === '/' ? '' : url.pathname}`;
        authResponse.headers.set('location', url.toString());
      }
    }
    return authResponse;
  }

  // If it's a regular response (e.g., allow access), we want to return the `intlResponse`
  // but we must merge the headers (like x-user-context) and cookies set by `updateSession`.
  authResponse.headers.forEach((value, key) => {
    // We only copy specific headers we know `updateSession` sets: x-user-context
    if (key.toLowerCase() === 'x-user-context') {
        intlResponse.headers.set(key, value);
    }
  });

  // We need to properly append cookies that were set in `authResponse`.
  const authSetCookies = authResponse.headers.getSetCookie();
  if (authSetCookies && authSetCookies.length > 0) {
    authSetCookies.forEach((cookieStr) => {
      // Avoid overwriting next-intl cookies. Instead, append.
      intlResponse.headers.append('set-cookie', cookieStr);
    });
  }

  return intlResponse;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(vi|en)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)']
};
