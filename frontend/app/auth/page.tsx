'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const handleWalletLogin = () => {
    // Navigate to wallet login page
    router.push('/auth/wallet');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">NYU Aptos Builder Camp</CardTitle>
          <CardDescription>
            Sign in to access the governance platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet-based Authentication */}
          <Button
            onClick={handleWalletLogin}
            className="w-full h-12 text-lg"
            variant="default"
            size="lg"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Connect Wallet
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>Connect your Aptos wallet to access the governance platform.</p>
            <p className="mt-2">Compatible with Petra, Pontem, Martian, and other AIP-62 wallets.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
