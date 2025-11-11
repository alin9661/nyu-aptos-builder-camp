'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  action: 'approve' | 'reject' | 'submit' | 'payout';
  amount?: string;
  recipient?: string;
  onConfirm: () => Promise<void>;
  variant?: 'default' | 'destructive';
}

type TransactionState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

export function TransactionModal({
  open,
  onOpenChange,
  title,
  description,
  action,
  amount,
  recipient,
  onConfirm,
  variant = 'default',
}: TransactionModalProps) {
  const [state, setState] = useState<TransactionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleConfirm = async () => {
    try {
      setState('confirming');

      // Simulate user confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState('processing');

      // Execute the transaction
      await onConfirm();

      setState('success');

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);
    } catch (error) {
      console.error('Transaction error:', error);
      setState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Transaction failed'
      );
    }
  };

  const handleCancel = () => {
    if (state !== 'processing') {
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setTimeout(() => {
      setState('idle');
      setErrorMessage('');
    }, 300);
  };

  const getActionLabel = () => {
    switch (action) {
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      case 'submit':
        return 'Submit';
      case 'payout':
        return 'Process Payout';
      default:
        return 'Confirm';
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'idle':
      case 'confirming':
        return (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Transaction Details */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Action</span>
                  <Badge variant={variant === 'destructive' ? 'destructive' : 'default'}>
                    {getActionLabel()}
                  </Badge>
                </div>

                {amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Amount</span>
                    <span className="text-lg font-semibold">{amount}</span>
                  </div>
                )}

                {recipient && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Recipient
                    </span>
                    <span className="text-sm font-mono truncate max-w-[200px]">
                      {recipient}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Gas Fee Estimate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    Est. Gas Fee
                  </div>
                  <span className="text-sm">~0.001 APT</span>
                </div>
              </div>

              {/* Warning for destructive actions */}
              {variant === 'destructive' && (
                <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone. Please confirm that you want to proceed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={state === 'confirming'}
              >
                Cancel
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'default'}
                onClick={handleConfirm}
                disabled={state === 'confirming'}
              >
                {state === 'confirming' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  `Confirm ${getActionLabel()}`
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'processing':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Processing Transaction</DialogTitle>
              <DialogDescription>
                Please wait while your transaction is being processed...
              </DialogDescription>
            </DialogHeader>

            <div className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Transaction in progress</p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few seconds...
                  </p>
                </div>
              </div>
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Transaction Successful</DialogTitle>
              <DialogDescription>
                Your transaction has been completed successfully
              </DialogDescription>
            </DialogHeader>

            <div className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Transaction confirmed!</p>
                  <p className="text-xs text-muted-foreground">
                    The transaction has been recorded on the blockchain
                  </p>
                </div>
              </div>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Transaction Failed</DialogTitle>
              <DialogDescription>
                An error occurred while processing your transaction
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Transaction failed</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {errorMessage || 'Please try again or contact support if the problem persists'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Close
              </Button>
              <Button onClick={() => setState('idle')}>Try Again</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">{renderContent()}</DialogContent>
    </Dialog>
  );
}
