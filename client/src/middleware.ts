import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — runs before every matched route.
 *
 * Protects /admin by verifying the access token stored in the
 * Authorization header (injected by the client via localStorage/cookie).
 *
 * Since Edge middleware cannot read localStorage, we rely on the refresh
 * cookie to detect a session and then gate the admin route by role via
 * an API call. If no refresh cookie exists, redirect to /login.
 *
 * For role verification we check the refreshToken cookie existence as a
 * fast-path gate (cookie is httpOnly, so only the server sets it).
 * The actual role check happens in the admin page/API calls — the middleware
 * acts as the first line of defence to prevent unauthenticated rendering.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protect /admin routes ────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const refreshToken = request.cookies.get('refreshToken');

    if (!refreshToken) {
      // No session at all — redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session cookie exists — let the page render.
    // The admin page itself should call the API which enforces requireAdmin.
    // The API will return 403 if the user is not an admin.
    return NextResponse.next();
  }

  // ── Protect authenticated account routes ─────────────────────────────────
  const protectedRoutes = ['/account', '/checkout', '/wishlist'];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const refreshToken = request.cookies.get('refreshToken');
    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/checkout',
    '/wishlist',
  ],
};
