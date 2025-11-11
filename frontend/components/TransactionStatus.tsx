'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/LoadingStates'
import { cn } from '@/lib/utils'
import { getTransactionErrorHint } from '@/lib/errors/ErrorHandler'

export type TransactionState = 'idle' | 'pending' | 'success' | 'error'

export interface TransactionStatusProps {
  state: TransactionState
  txHash?: string
  error?: string
  errorCode?: string
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * Transaction Status Component
 * Shows pending, success, or error states for blockchain transactions
 */
export function TransactionStatus({
  state,
  txHash,
  error,
  errorCode,
  message,
  onRetry,
  onDismiss,
  className,
}: TransactionStatusProps) {
  if (state === 'idle') return null

  const hint = errorCode ? getTransactionErrorHint(errorCode) : undefined

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm transition-all',
        {
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50': state === 'pending',
          'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50':
            state === 'success',
          'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50': state === 'error',
        },
        className
      )}
      role="status"
      aria-live="polite"
    >
      {state === 'pending' && (
        <PendingTransaction message={message || 'Processing transaction...'} />
      )}
      {state === 'success' && (
        <SuccessTransaction
          txHash={txHash}
          message={message || 'Transaction confirmed!'}
          onDismiss={onDismiss}
        />
      )}
      {state === 'error' && (
        <ErrorTransaction
          error={error || 'Transaction failed'}
          hint={hint}
          onRetry={onRetry}
          onDismiss={onDismiss}
        />
      )}
    </div>
  )
}

interface PendingTransactionProps {
  message: string
}

function PendingTransaction({ message }: PendingTransactionProps) {
  return (
    <div className="flex items-start gap-3">
      <Spinner size="md" className="mt-0.5 border-blue-600 dark:border-blue-400" />
      <div className="flex-1">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Processing</h4>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{message}</p>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          Please confirm the transaction in your wallet if prompted.
        </p>
      </div>
    </div>
  )
}

interface SuccessTransactionProps {
  txHash?: string
  message: string
  onDismiss?: () => void
}

function SuccessTransaction({ txHash, message, onDismiss }: SuccessTransactionProps) {
  const explorerUrl = txHash
    ? `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`
    : undefined

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        <svg
          className="size-5 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-green-900 dark:text-green-100">Success!</h4>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">{message}</p>
        {txHash && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-green-700 underline hover:no-underline dark:text-green-300"
            >
              View on Explorer
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <span className="text-xs text-green-600 dark:text-green-400">•</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(txHash)
              }}
              className="text-xs font-medium text-green-700 underline hover:no-underline dark:text-green-300"
            >
              Copy Hash
            </button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-green-700 opacity-70 transition-opacity hover:opacity-100 dark:text-green-300"
          aria-label="Dismiss"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface ErrorTransactionProps {
  error: string
  hint?: string
  onRetry?: () => void
  onDismiss?: () => void
}

function ErrorTransaction({ error, hint, onRetry, onDismiss }: ErrorTransactionProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        <svg
          className="size-5 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-red-900 dark:text-red-100">Transaction Failed</h4>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
        {hint && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">Tip:</span> {hint}
          </p>
        )}
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            Try Again
          </Button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-red-700 opacity-70 transition-opacity hover:opacity-100 dark:text-red-300"
          aria-label="Dismiss"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/**
 * Inline Transaction Indicator (for buttons/forms)
 */
export function InlineTransactionStatus({
  state,
  className,
}: {
  state: TransactionState
  className?: string
}) {
  if (state === 'idle') return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {state === 'pending' && (
        <>
          <Spinner size="sm" className="border-blue-600" />
          <span className="text-sm text-blue-600">Processing...</span>
        </>
      )}
      {state === 'success' && (
        <>
          <svg className="size-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm text-green-600">Success!</span>
        </>
      )}
      {state === 'error' && (
        <>
          <svg className="size-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm text-red-600">Failed</span>
        </>
      )}
    </div>
  )
}

/**
 * Transaction History Link
 */
export function TransactionHistoryLink({ className }: { className?: string }) {
  return (
    <a
      href="https://explorer.aptoslabs.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline',
        className
      )}
    >
      View transaction history
      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  )
}
