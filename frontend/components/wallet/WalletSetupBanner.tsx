'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wallet, X, Sparkles } from 'lucide-react';

interface WalletSetupBannerProps {
  onCreateWallet?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function WalletSetupBanner({
  onCreateWallet,
  onDismiss,
  variant = 'default',
  className = '',
}: WalletSetupBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <div>
            <p className="text-sm font-medium text-foreground">Create your wallet to get started</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCreateWallet && (
            <Button onClick={onCreateWallet} size="sm" variant="default">
              <Wallet className="mr-2 h-3 w-3" />
              Create Wallet
            </Button>
          )}
          {onDismiss && (
            <Button onClick={handleDismiss} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Alert className={`border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-violet-500/10 rounded-full mt-0.5">
            <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <AlertTitle className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-1">
                Welcome! Set Up Your Wallet
              </AlertTitle>
              <AlertDescription className="text-violet-800 dark:text-violet-200">
                To participate in governance, vote on proposals, and manage treasury funds, you'll need an Aptos wallet.
                We'll create a secure, encrypted wallet for you automatically.
              </AlertDescription>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm text-violet-700 dark:text-violet-300">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm text-violet-700 dark:text-violet-300">Auto-Funded on Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm text-violet-700 dark:text-violet-300">Ready in Seconds</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {onCreateWallet && (
                <Button onClick={onCreateWallet} size="default" className="shadow-md">
                  <Wallet className="mr-2 h-4 w-4" />
                  Create My Wallet
                </Button>
              )}
              <Button
                onClick={() => {
                  // Open documentation or help
                  window.open('https://aptos.dev/guides/getting-started', '_blank');
                }}
                size="default"
                variant="outline"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {onDismiss && (
          <Button onClick={handleDismiss} size="icon" variant="ghost" className="ml-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Compact variant for smaller spaces
 */
export function WalletSetupBannerCompact(props: WalletSetupBannerProps) {
  return <WalletSetupBanner {...props} variant="compact" />;
}
