import type { NextRequest } from 'next/server';
import { auth0 } from './lib/auth0';

/**
 * Next.js Middleware for Auth0 authentication
 * This middleware handles authentication routes automatically:
 * - /auth/login: Initiates the authentication flow
 * - /auth/logout: Logs out the user
 * - /auth/callback: Handles the OAuth callback from Auth0
 */
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

/**
 * Configure which routes the middleware should run on
 * This pattern matches all routes except Next.js internals
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
