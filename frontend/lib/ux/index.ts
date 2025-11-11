/**
 * UX Enhancements Index
 * Exports all UX enhancement utilities and components
 */

// Loading States
export {
  Spinner,
  ButtonSpinner,
  FullPageSpinner,
  LoadingOverlay,
  InlineLoading,
  DashboardCardSkeleton,
  StatCardSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ProfileSkeleton,
} from '@/components/ui/LoadingStates'

// Error Handling
export {
  ErrorBoundary,
  PageErrorFallback,
  InlineError,
  EmptyStateError,
  type ErrorBoundaryProps,
  type ErrorBoundaryFallbackProps,
} from '@/components/ui/ErrorBoundary'

export {
  parseError,
  logError,
  handleErrorWithRetry,
  createError,
  getTransactionErrorHint,
  formatErrorForDisplay,
  ErrorType,
  TransactionErrorCode,
  type AppError,
} from '@/lib/errors/ErrorHandler'

// Toast Notifications
export {
  ToastProvider,
  useToast,
  type Toast,
  type ToastVariant,
} from '@/components/ui/Toast'

// Transaction Status
export {
  TransactionStatus,
  InlineTransactionStatus,
  TransactionHistoryLink,
  type TransactionState,
  type TransactionStatusProps,
} from '@/components/TransactionStatus'

// Notification Center
export {
  NotificationCenterProvider,
  NotificationCenter,
  useNotifications,
  type Notification,
  type NotificationType,
} from '@/components/NotificationCenter'

// Optimistic Updates
export {
  withOptimisticUpdate,
  OptimisticStateManager,
  createOptimisticHook,
  listOptimisticHelpers,
  objectOptimisticHelpers,
  type OptimisticAction,
  type OptimisticUpdateConfig,
} from '@/lib/optimistic/updates'
