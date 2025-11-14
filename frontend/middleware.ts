import type { NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Middleware for handling Auth0 authentication
 * The Auth0 v4 middleware handles all authentication routes automatically:
 * - /api/auth/login - Initiates Auth0 login (Google OAuth)
 * - /api/auth/logout - Logs out the user
 * - /api/auth/callback - Handles Auth0 callback after successful login
 *
 * Custom configuration uses /api/auth prefix to avoid conflict with /auth page
 */
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
