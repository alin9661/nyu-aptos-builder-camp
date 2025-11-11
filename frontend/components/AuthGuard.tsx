'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check on auth pages
    if (pathname?.startsWith('/auth')) {
      return;
    }

    if (!isLoading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required
        router.push('/auth');
      }
    }
  }, [user, isLoading, requireAuth, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (requireAuth && !user && !pathname?.startsWith('/auth')) {
    return null;
  }

  return <>{children}</>;
}
