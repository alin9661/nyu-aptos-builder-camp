'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  authentication_failed: {
    title: 'Authentication Failed',
    description: 'We could not verify your identity. Please try again.',
  },
  user_not_found: {
    title: 'User Not Found',
    description: 'Your account could not be found. Please contact support.',
  },
  callback_error: {
    title: 'Callback Error',
    description: 'An error occurred during the authentication process.',
  },
  sso_failed: {
    title: 'SSO Failed',
    description: 'Single Sign-On authentication failed. Please try again.',
  },
  default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
  },
};

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState(ERROR_MESSAGES.default);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message && ERROR_MESSAGES[message]) {
      setErrorInfo(ERROR_MESSAGES[message]);
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth');
  };

  const handleContactSupport = () => {
    // In production, this would link to a support page or email
    window.location.href = 'mailto:support@nyu-aptos.app';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ensure you are using your NYU NetID</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try using a different browser</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleRetry} className="w-full" size="lg">
            Try Again
          </Button>
          <Button
            onClick={handleContactSupport}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Contact Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>Loading error details...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
