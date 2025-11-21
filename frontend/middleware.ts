import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { auth0 } from './lib/auth0';

/**
 * Middleware for handling Auth0 authentication
 *
 * NOTE: Auth0 middleware is currently disabled due to Edge Runtime incompatibility
 * with @auth0/nextjs-auth0 v4 (references Node.js crypto module).
 *
 * To enable authentication, we should use per-page/per-route protection or
 * wait for an Edge-compatible update from Auth0.
 */
export async function middleware(request: NextRequest) {
  // return await auth0.middleware(request);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (Auth0 API routes - handled by route handler)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
