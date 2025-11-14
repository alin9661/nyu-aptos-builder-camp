'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, ArrowLeft } from 'lucide-react';
import { requestWalletNonce, loginWithWallet } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWalletCompat as useWallet } from '@/lib/wallet/compatibilityHooks';

export default function WalletAuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { connect, disconnect, account, connected, wallets, signMessage } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'connect' | 'signing' | 'verifying'>('connect');

  const handleWalletConnect = async () => {
    if (!connected) {
      try {
        // Find the first installed wallet
        const installedWallet = wallets.find(w => w.readyState === 'Installed');
        if (!installedWallet) {
          setError('No Aptos wallet found. Please install Petra or another Aptos wallet.');
          return;
        }

        // Connect to the wallet (new API connects directly with wallet name)
        await connect(installedWallet.name);
      } catch (err) {
        console.error('Wallet connection error:', err);
        setError('Failed to connect wallet. Please make sure you have an Aptos wallet installed.');
      }
    }
  };

  const handleSignAndLogin = async () => {
    if (!account || !connected) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError('');
    setStep('signing');

    try {
      // Request nonce from backend
      const nonceResponse = await requestWalletNonce(account.address.toString());

      if (!nonceResponse.success || !nonceResponse.data) {
        throw new Error(nonceResponse.error || 'Failed to get nonce');
      }

      const { message } = nonceResponse.data;

      // Sign the message using the connected wallet
      const signResponse = await signMessage({
        message,
        nonce: nonceResponse.data.nonce,
      });

      if (!signResponse) {
        throw new Error('Failed to sign message');
      }

      // Debug logging - see what Petra returns
      console.log('=== PETRA SIGN RESPONSE ===');
      console.log('Full response:', signResponse);
      console.log('Signature type:', typeof signResponse.signature);
      console.log('Signature:', signResponse.signature);
      console.log('Account publicKey type:', typeof account.publicKey);
      console.log('Account publicKey:', account.publicKey);
      console.log('===========================');

      setStep('verifying');

      // Send signature to backend for verification
      // Extract hex strings from Aptos SDK objects
      const signatureHex = typeof signResponse.signature === 'string'
        ? signResponse.signature
        : (signResponse.signature as any).hex?.() || (signResponse.signature as any).toString();

      const publicKeyHex = typeof account.publicKey === 'string'
        ? account.publicKey
        : (account.publicKey as any).hex?.() || (account.publicKey as any).toString();

      console.log('Extracted signatureHex:', signatureHex);
      console.log('Extracted publicKeyHex:', publicKeyHex);

      const loginResponse = await loginWithWallet({
        address: account.address.toString(),
        message,
        signature: signatureHex,
        publicKey: publicKeyHex,
      });

      if (!loginResponse.success || !loginResponse.data) {
        throw new Error(loginResponse.error || 'Login failed');
      }

      const { user, accessToken, refreshToken } = loginResponse.data;

      // Store tokens and update auth context
      login(accessToken, refreshToken, user.address, user.role);

      // Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Wallet authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setStep('connect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/auth');
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setStep('connect');
      setError('');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">Connect Wallet</CardTitle>
          </div>
          <CardDescription>
            Sign in with your Aptos wallet to access the governance platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {connected && account ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Connected Wallet</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {account.address.toString().slice(0, 6)}...{account.address.toString().slice(-4)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSignAndLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {step === 'signing' && 'Signing message...'}
                    {step === 'verifying' && 'Verifying...'}
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Sign & Login
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleWalletConnect}
                className="w-full"
                disabled={isLoading}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Aptos Wallet
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Recommended: Install{' '}
                  <a
                    href="https://petra.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Petra Wallet
                  </a>
                </p>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have a wallet?{' '}
              <a
                href="https://aptos.dev/guides/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Learn how to create one
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}