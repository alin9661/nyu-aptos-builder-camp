import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Configure Auth0 to use /api/auth routes instead of /auth
// This prevents conflict with the custom /auth page
export const auth0 = new Auth0Client({
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    postLogoutRedirect: '/auth',
  },
});
