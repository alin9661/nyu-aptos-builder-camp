'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Wallet, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WalletNotificationBannerProps {
  onViewWallet?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

const STORAGE_KEY = 'wallet-banner-dismissed';

export function WalletNotificationBanner({
  onViewWallet,
  onLearnMore,
  className,
}: WalletNotificationBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ensure we're on the client before accessing localStorage
    if (typeof window === 'undefined') return;

    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <Alert
      className={cn(
        'relative border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 dark:border-violet-900',
        className
      )}
    >
      <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
      <AlertTitle className="text-violet-900 dark:text-violet-100 font-semibold pr-8">
        Your Aptos Wallet is Ready!
      </AlertTitle>
      <AlertDescription className="text-violet-800 dark:text-violet-200 mt-2">
        <p className="mb-3">
          We've created a secure blockchain wallet for you. You can now participate in governance
          and request reimbursements.
        </p>
        <div className="flex flex-wrap gap-2">
          {onViewWallet && (
            <Button
              size="sm"
              onClick={onViewWallet}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Wallet className="h-4 w-4" />
              View Wallet
            </Button>
          )}
          {onLearnMore && (
            <Button
              size="sm"
              variant="outline"
              onClick={onLearnMore}
              className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleDismiss}
        className="absolute right-2 top-2 h-7 w-7 hover:bg-violet-200 dark:hover:bg-violet-900/50"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}

// Compact version of the banner for smaller spaces
export function WalletNotificationBannerCompact({
  onViewWallet,
  className,
}: {
  onViewWallet?: () => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ensure we're on the client before accessing localStorage
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 dark:border-violet-900 p-3',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
            Your wallet is ready!
          </p>
          <p className="text-xs text-violet-700 dark:text-violet-300 truncate">
            Start using your Aptos wallet
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onViewWallet && (
          <Button
            size="sm"
            onClick={onViewWallet}
            className="bg-violet-600 hover:bg-violet-700 text-white h-8"
          >
            View
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="h-7 w-7 hover:bg-violet-200 dark:hover:bg-violet-900/50 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Success variant for after completing wallet setup
export function WalletSetupSuccessBanner({
  onClose,
  className,
}: {
  onClose?: () => void;
  className?: string;
}) {
  return (
    <Alert
      className={cn(
        'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900',
        className
      )}
    >
      <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-900 dark:text-green-100 font-semibold pr-8">
        Wallet Setup Complete!
      </AlertTitle>
      <AlertDescription className="text-green-800 dark:text-green-200">
        Your Aptos wallet has been successfully configured and is ready to use.
      </AlertDescription>
      {onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute right-2 top-2 h-7 w-7 hover:bg-green-200 dark:hover:bg-green-900/50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
