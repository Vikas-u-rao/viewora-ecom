import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — runs before every matched route.
 *
 * Auth protection is handled client-side by the AuthContext (which restores
 * sessions from localStorage). This middleware only handles redirects for
 * routes that absolutely cannot be rendered without auth (e.g. /account,
 * /checkout) by checking for the refreshToken cookie. The admin layout
 * has its own client-side auth guard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protect /admin routes ────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const refreshToken = request.cookies.get('refreshToken');
    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Protect authenticated user routes ─────────────────────────────────
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
