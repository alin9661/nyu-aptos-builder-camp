/**
 * Error Handler Utility
 * Provides centralized error handling, logging, and user-friendly error messages
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  TRANSACTION = 'TRANSACTION',
  VALIDATION = 'VALIDATION',
  API = 'API',
  UNKNOWN = 'UNKNOWN',
}

export enum TransactionErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_REJECTED = 'USER_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_PARAMS = 'INVALID_PARAMS',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  GAS_ESTIMATION_FAILED = 'GAS_ESTIMATION_FAILED',
}

export interface AppError {
  type: ErrorType
  code?: string
  message: string
  userMessage: string
  details?: unknown
  timestamp: Date
  retryable: boolean
}

/**
 * Parse and classify errors
 */
export function parseError(error: unknown): AppError {
  const timestamp = new Date()

  // Handle null/undefined
  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      timestamp,
      retryable: true,
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: ErrorType.NETWORK,
        message: error.message,
        userMessage: 'Network error. Please check your connection and try again.',
        timestamp,
        retryable: true,
      }
    }

    // Wallet errors
    if (
      error.message.includes('wallet') ||
      error.message.includes('user rejected') ||
      error.message.includes('User rejected')
    ) {
      return {
        type: ErrorType.WALLET,
        code: TransactionErrorCode.USER_REJECTED,
        message: error.message,
        userMessage: 'Transaction was rejected. Please try again if you wish to proceed.',
        timestamp,
        retryable: true,
      }
    }

    // Transaction errors
    if (error.message.includes('insufficient') || error.message.includes('balance')) {
      return {
        type: ErrorType.TRANSACTION,
        code: TransactionErrorCode.INSUFFICIENT_FUNDS,
        message: error.message,
        userMessage: 'Insufficient funds to complete this transaction.',
        timestamp,
        retryable: false,
      }
    }

    if (error.message.includes('gas')) {
      return {
        type: ErrorType.TRANSACTION,
        code: TransactionErrorCode.GAS_ESTIMATION_FAILED,
        message: error.message,
        userMessage: 'Unable to estimate gas fees. Please try again.',
        timestamp,
        retryable: true,
      }
    }

    if (error.message.includes('timeout')) {
      return {
        type: ErrorType.TRANSACTION,
        code: TransactionErrorCode.TIMEOUT,
        message: error.message,
        userMessage: 'Transaction timed out. Please check your wallet and try again.',
        timestamp,
        retryable: true,
      }
    }
  }

  // Handle API errors (objects with status code)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>

    if ('status' in errorObj || 'statusCode' in errorObj) {
      const status = (errorObj.status || errorObj.statusCode) as number

      return {
        type: ErrorType.API,
        code: status.toString(),
        message: (errorObj.message as string) || `API Error: ${status}`,
        userMessage: getApiErrorMessage(status),
        details: errorObj,
        timestamp,
        retryable: status >= 500,
      }
    }
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again.',
    timestamp,
    retryable: true,
  }
}

/**
 * Get user-friendly messages for API error codes
 */
function getApiErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Unauthorized. Please connect your wallet.'
    case 403:
      return 'Access denied. You do not have permission to perform this action.'
    case 404:
      return 'Resource not found. Please refresh and try again.'
    case 408:
      return 'Request timeout. Please try again.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    case 502:
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    default:
      return 'An error occurred. Please try again.'
  }
}

/**
 * Log errors (can be extended to send to error tracking service)
 */
export function logError(error: AppError): void {
  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', {
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
    })
  }

  // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(error)
  // }
}

/**
 * Handle error with retry logic
 */
export async function handleErrorWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: AppError | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = parseError(error)
      logError(lastError)

      // Don't retry if error is not retryable
      if (!lastError.retryable) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}

/**
 * Create an error with additional context
 */
export function createError(
  type: ErrorType,
  message: string,
  userMessage: string,
  options?: {
    code?: string
    details?: unknown
    retryable?: boolean
  }
): AppError {
  return {
    type,
    message,
    userMessage,
    timestamp: new Date(),
    retryable: options?.retryable ?? true,
    ...options,
  }
}

/**
 * Get helpful hints for transaction errors
 */
export function getTransactionErrorHint(code?: string): string | undefined {
  switch (code) {
    case TransactionErrorCode.INSUFFICIENT_FUNDS:
      return 'Make sure you have enough APT tokens to cover the transaction and gas fees.'
    case TransactionErrorCode.USER_REJECTED:
      return 'You can try the transaction again from your wallet.'
    case TransactionErrorCode.GAS_ESTIMATION_FAILED:
      return 'The network may be congested. Try increasing the gas limit.'
    case TransactionErrorCode.TIMEOUT:
      return 'Check your wallet for pending transactions that may need approval.'
    case TransactionErrorCode.CONTRACT_ERROR:
      return 'The smart contract rejected this transaction. Please verify your inputs.'
    default:
      return undefined
  }
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: unknown): {
  title: string
  message: string
  hint?: string
  retryable: boolean
} {
  const parsedError = parseError(error)

  return {
    title: getErrorTitle(parsedError.type),
    message: parsedError.userMessage,
    hint: getTransactionErrorHint(parsedError.code),
    retryable: parsedError.retryable,
  }
}

/**
 * Get error title based on type
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Connection Error'
    case ErrorType.WALLET:
      return 'Wallet Error'
    case ErrorType.TRANSACTION:
      return 'Transaction Failed'
    case ErrorType.VALIDATION:
      return 'Validation Error'
    case ErrorType.API:
      return 'Server Error'
    default:
      return 'Error'
  }
}
