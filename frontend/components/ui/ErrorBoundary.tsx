'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { parseError, logError, type AppError } from '@/lib/errors/ErrorHandler'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

export interface ErrorBoundaryFallbackProps {
  error: AppError | null
  resetError: () => void
}

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const parsedError = parseError(error)
    logError(parsedError)

    return {
      hasError: true,
      error: parsedError,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error info
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Call optional onError callback
    this.props.onError?.(error, errorInfo)
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

/**
 * Default Error Fallback UI
 */
function DefaultErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="size-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
          {error && (
            <p className="text-sm text-muted-foreground">
              {error.userMessage || 'An unexpected error occurred'}
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase text-destructive">
              Development Info
            </p>
            <p className="text-xs font-mono text-muted-foreground">{error.message}</p>
            {error.code && (
              <p className="mt-1 text-xs text-muted-foreground">
                Code: <span className="font-mono">{error.code}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={resetError} size="lg">
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Page Error Fallback (Full Page)
 */
export function PageErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="size-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Oops! Something went wrong</h1>
            {error && (
              <p className="text-lg text-muted-foreground">
                {error.userMessage || "We're having trouble loading this page"}
              </p>
            )}
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase text-destructive">
              Development Info
            </p>
            <p className="text-sm font-mono text-muted-foreground">{error.message}</p>
            {error.code && (
              <p className="mt-2 text-xs text-muted-foreground">
                Error Code: <span className="font-mono">{error.code}</span>
              </p>
            )}
            {error.type && (
              <p className="mt-1 text-xs text-muted-foreground">
                Type: <span className="font-mono">{error.type}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={resetError} size="lg" className="sm:min-w-[140px]">
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              window.location.href = '/'
            }}
            className="sm:min-w-[140px]"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}

/**
 * Inline Error Display (for smaller sections)
 */
interface InlineErrorProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function InlineError({ error, onRetry, className }: InlineErrorProps) {
  const parsedError = parseError(error)

  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/20 bg-destructive/5 p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 size-5 shrink-0 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-destructive">
            {parsedError.userMessage}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground">{parsedError.message}</p>
          )}
        </div>
        {onRetry && parsedError.retryable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Empty State with Error (for lists/tables)
 */
interface EmptyStateErrorProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function EmptyStateError({
  title = 'Unable to load data',
  message,
  onRetry,
}: EmptyStateErrorProps) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <svg
            className="size-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
