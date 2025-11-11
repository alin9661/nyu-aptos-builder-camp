'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { createWallet } from '@/lib/api/wallet';
import { useAuth } from '@/lib/auth/AuthContext';

interface CreateWalletCardProps {
  onSuccess?: () => void;
  className?: string;
}

export function CreateWalletCard({ onSuccess, className }: CreateWalletCardProps) {
  const { refreshWallet } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await createWallet();

      if (result) {
        setSuccess(true);
        setWalletAddress(result.wallet.address);

        // Refresh wallet info in auth context
        await refreshWallet();

        // Call success callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(errorMessage);
      console.error('Wallet creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleCreateWallet();
  };

  if (success && walletAddress) {
    return (
      <Card className={`border-green-500/50 bg-green-50/50 dark:bg-green-950/20 ${className || ''}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">Wallet Created Successfully!</CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Your Aptos wallet has been generated and secured
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
            <p className="font-mono text-sm break-all text-foreground">{walletAddress}</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Your wallet is ready to use!</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                You can now participate in governance, submit reimbursements, and manage treasury funds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className || ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 rounded-full">
            <Wallet className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle>Create Your Aptos Wallet</CardTitle>
            <CardDescription>
              Generate a secure wallet to participate in the DAO
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Encrypted & Secure</p>
              <p className="text-muted-foreground">Your private key is encrypted with AES-256-GCM</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Auto-Generated</p>
              <p className="text-muted-foreground">No need to manage seeds or recovery phrases</p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Instant Access</p>
              <p className="text-muted-foreground">Start voting and managing funds immediately</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            Your wallet will be automatically funded with test APT tokens on the Aptos testnet.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleCreateWallet}
          disabled={isCreating}
          className="flex-1"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Wallet...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Create Wallet
            </>
          )}
        </Button>
        {error && (
          <Button
            onClick={handleRetry}
            disabled={isCreating}
            variant="outline"
            size="lg"
          >
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
