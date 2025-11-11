# UX Enhancements Documentation

## Overview

Comprehensive UX enhancements for the Nexus governance platform, including loading states, error handling, toast notifications, transaction feedback, mobile responsiveness, notifications, and optimistic UI updates.

## Table of Contents

1. [Loading States](#loading-states)
2. [Error Handling](#error-handling)
3. [Toast Notifications](#toast-notifications)
4. [Transaction Feedback](#transaction-feedback)
5. [Mobile Responsive Design](#mobile-responsive-design)
6. [Notification System](#notification-system)
7. [Optimistic UI Updates](#optimistic-ui-updates)
8. [Accessibility Features](#accessibility-features)

---

## Loading States

### Components

Located in `/frontend/components/ui/LoadingStates.tsx`

#### Spinners

```tsx
import { Spinner, ButtonSpinner, FullPageSpinner } from '@/lib/ux'

// Basic spinner
<Spinner size="md" />

// Button with spinner
<Button disabled>
  <ButtonSpinner />
  Loading...
</Button>

// Full page loading
<FullPageSpinner />
```

#### Loading Overlays

```tsx
import { LoadingOverlay, InlineLoading } from '@/lib/ux'

// Overlay for blocking interactions
<div className="relative">
  <LoadingOverlay message="Processing transaction..." />
  <YourContent />
</div>

// Inline loading indicator
<InlineLoading text="Fetching data..." />
```

#### Skeleton Screens

```tsx
import {
  DashboardCardSkeleton,
  StatCardSkeleton,
  ListSkeleton,
  TableSkeleton,
} from '@/lib/ux'

// Dashboard card skeleton
{isLoading ? <DashboardCardSkeleton /> : <DashboardCard data={data} />}

// List skeleton
{isLoading ? <ListSkeleton count={5} /> : <List items={items} />}

// Table skeleton
{isLoading ? <TableSkeleton rows={10} /> : <DataTable data={data} />}
```

---

## Error Handling

### Error Boundary

Located in `/frontend/components/ui/ErrorBoundary.tsx`

```tsx
import { ErrorBoundary, PageErrorFallback } from '@/lib/ux'

// Wrap your app (already integrated in layout.tsx)
<ErrorBoundary fallback={PageErrorFallback}>
  <YourApp />
</ErrorBoundary>

// Section-level error boundary
<ErrorBoundary onError={(error, info) => console.error(error)}>
  <ProposalsList />
</ErrorBoundary>
```

### Error Handler Utility

Located in `/frontend/lib/errors/ErrorHandler.ts`

```tsx
import { parseError, formatErrorForDisplay, handleErrorWithRetry } from '@/lib/ux'

// Parse and display errors
try {
  await submitProposal(data)
} catch (error) {
  const { title, message, hint, retryable } = formatErrorForDisplay(error)
  toast.error(message, title)
  if (hint) console.log('Hint:', hint)
}

// Retry with automatic error handling
const data = await handleErrorWithRetry(
  () => fetchProposals(),
  3, // max retries
  1000 // delay in ms
)
```

### Inline Errors

```tsx
import { InlineError, EmptyStateError } from '@/lib/ux'

// Show error in forms or sections
{error && <InlineError error={error} onRetry={refetch} />}

// Empty state with error
<EmptyStateError
  title="Failed to load proposals"
  message="Please check your connection and try again"
  onRetry={refetch}
/>
```

---

## Toast Notifications

### Setup

Located in `/frontend/components/ui/Toast.tsx`

Already integrated in `layout.tsx` via `ToastProvider`.

### Usage

```tsx
'use client'

import { useToast } from '@/lib/ux'

function MyComponent() {
  const toast = useToast()

  const handleSubmit = async () => {
    try {
      await submitData()
      toast.success('Proposal created successfully!')
    } catch (error) {
      toast.error('Failed to create proposal', 'Error')
    }
  }

  return <Button onClick={handleSubmit}>Submit</Button>
}
```

### Transaction Toasts

```tsx
const toast = useToast()

// Show pending transaction
const toastId = toast.txPending('Submitting proposal...')

try {
  const txHash = await submitProposal()

  // Remove pending toast
  toast.removeToast(toastId)

  // Show success with explorer link
  toast.txSuccess(txHash, 'Proposal submitted!')
} catch (error) {
  toast.removeToast(toastId)
  toast.txError('Failed to submit proposal')
}
```

### Toast Variants

```tsx
toast.success('Success message')
toast.error('Error message')
toast.warning('Warning message')
toast.info('Info message')

// With custom action
toast.addToast({
  message: 'Proposal approved',
  variant: 'success',
  action: {
    label: 'View',
    onClick: () => router.push('/proposals/123')
  }
})
```

---

## Transaction Feedback

### TransactionStatus Component

Located in `/frontend/components/TransactionStatus.tsx`

```tsx
import { TransactionStatus, InlineTransactionStatus } from '@/lib/ux'
import { useState } from 'react'

function ProposalVote() {
  const [txState, setTxState] = useState<TransactionState>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<string>()

  const handleVote = async () => {
    setTxState('pending')
    try {
      const hash = await voteOnProposal()
      setTxHash(hash)
      setTxState('success')
    } catch (err) {
      setError(err.message)
      setTxState('error')
    }
  }

  return (
    <>
      <Button onClick={handleVote} disabled={txState === 'pending'}>
        Vote
      </Button>

      <TransactionStatus
        state={txState}
        txHash={txHash}
        error={error}
        onRetry={handleVote}
        onDismiss={() => setTxState('idle')}
      />
    </>
  )
}
```

### Inline Transaction Indicator

```tsx
// Show transaction status inline (e.g., in button or form)
<InlineTransactionStatus state={txState} />
```

---

## Mobile Responsive Design

### CSS Utilities

Located in `/frontend/app/globals.css`

#### Touch-Friendly Elements

```tsx
// Buttons with minimum 44px touch target
<Button className="btn-touch">
  Action
</Button>
```

#### Responsive Text

```tsx
<h1 className="heading-mobile">Title</h1>
<h2 className="subheading-mobile">Subtitle</h2>
<p className="text-mobile-base">Content</p>
```

#### Responsive Containers

```tsx
<div className="container-mobile">
  <div className="card-mobile">
    Content
  </div>
</div>
```

#### Responsive Grids

```tsx
// Auto-responsive grid
<div className="grid-mobile">
  <Card />
  <Card />
  <Card />
</div>

// Auto-sizing grid
<div className="grid-mobile-auto">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

#### Mobile Scroll Containers

```tsx
// Horizontal scroll on mobile, normal on desktop
<div className="scroll-mobile">
  <div className="flex gap-4">
    <Card />
    <Card />
    <Card />
  </div>
</div>
```

#### Collapsible Sections

```tsx
// Hide on mobile, show on desktop
<div className="mobile-expand">
  Desktop-only content
</div>

// Show on mobile, hide on desktop
<div className="mobile-collapse">
  Mobile-only content
</div>
```

### Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Accessibility Features

- **Touch targets**: Minimum 44px for touch devices
- **Reduced motion**: Respects `prefers-reduced-motion`
- **High contrast**: Enhanced borders for `prefers-contrast: high`
- **Screen readers**: Proper ARIA labels on all interactive elements

---

## Notification System

### Setup

Located in `/frontend/components/NotificationCenter.tsx`

Already integrated in `layout.tsx` and `site-header.tsx`.

### Usage

```tsx
'use client'

import { useNotifications } from '@/lib/ux'

function MyComponent() {
  const { addNotification, unreadCount } = useNotifications()

  const handleProposalCreated = (proposal) => {
    addNotification({
      type: 'proposal_created',
      title: 'New Proposal',
      message: `${proposal.title} has been created`,
      actionUrl: `/proposals/${proposal.id}`,
    })
  }

  return <div>Unread: {unreadCount}</div>
}
```

### Notification Types

```typescript
type NotificationType =
  | 'approval_needed'      // Yellow warning icon
  | 'transaction_complete' // Green check icon
  | 'vote_reminder'        // Blue clock icon
  | 'proposal_created'     // Purple document icon
  | 'election_started'     // Indigo people icon
  | 'reimbursement_approved' // Green money icon
  | 'reimbursement_rejected' // Red X icon
  | 'info'                 // Gray info icon
```

### Notification Methods

```tsx
const notifications = useNotifications()

// Add notification
notifications.addNotification({
  type: 'vote_reminder',
  title: 'Vote Reminder',
  message: 'Proposal XYZ ends in 24 hours',
  actionUrl: '/proposals/xyz',
})

// Mark as read
notifications.markAsRead(notificationId)

// Mark all as read
notifications.markAllAsRead()

// Remove notification
notifications.removeNotification(notificationId)

// Clear all
notifications.clearAll()
```

---

## Optimistic UI Updates

### Simple Optimistic Update

Located in `/frontend/lib/optimistic/updates.ts`

```tsx
import { withOptimisticUpdate } from '@/lib/ux'
import { useState } from 'react'

function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([])

  const createProposal = async (data: ProposalInput) => {
    const tempProposal = {
      id: 'temp-' + Date.now(),
      ...data,
      status: 'pending'
    }

    await withOptimisticUpdate(
      proposals,
      setProposals,
      {
        // Add to list immediately
        optimisticUpdate: (state) => [tempProposal, ...state],

        // Perform actual API call
        mutationFn: () => api.createProposal(data),

        // Rollback on error
        rollback: (previousState) => previousState,

        // Replace temp with confirmed
        onSuccess: (confirmedProposal, state) => {
          return state.map(p =>
            p.id === tempProposal.id ? confirmedProposal : p
          )
        },
      }
    )
  }

  return <ProposalForm onSubmit={createProposal} />
}
```

### List Helpers

```tsx
import { listOptimisticHelpers } from '@/lib/ux'

const { addItem, updateItem, removeItem, rollbackAdd } = listOptimisticHelpers

// Add item optimistically
const optimisticState = addItem(currentList, newItem)

// Update item optimistically
const optimisticState = updateItem(currentList, itemId, (item) => ({
  ...item,
  votes: item.votes + 1
}))

// Remove item optimistically
const optimisticState = removeItem(currentList, itemId)

// Rollback add if failed
const rolledBack = rollbackAdd(optimisticState, tempId)
```

### Vote Example with Optimistic Update

```tsx
const handleVote = async (proposalId: string) => {
  const originalProposal = proposals.find(p => p.id === proposalId)

  await withOptimisticUpdate(
    proposals,
    setProposals,
    {
      optimisticUpdate: (state) =>
        state.map(p =>
          p.id === proposalId
            ? { ...p, votes: p.votes + 1, userVoted: true }
            : p
        ),
      mutationFn: () => api.voteOnProposal(proposalId),
      rollback: (previousState) => previousState,
      onError: (error) => {
        toast.error('Failed to submit vote')
      },
    }
  )
}
```

---

## Accessibility Features

### Implemented Accessibility Standards

1. **ARIA Labels**: All interactive elements have proper `aria-label` attributes
2. **Keyboard Navigation**: All components support keyboard-only navigation
3. **Focus Management**: Visible focus indicators on all interactive elements
4. **Screen Reader Support**:
   - Live regions with `aria-live="polite"` for toasts and notifications
   - Status updates announced to screen readers
   - Hidden text for icon-only buttons (`<span className="sr-only">`)
5. **Color Contrast**: WCAG AA compliant color contrasts
6. **Touch Targets**: Minimum 44x44px for touch devices
7. **Reduced Motion**: Respects `prefers-reduced-motion` media query
8. **High Contrast Mode**: Enhanced borders for `prefers-contrast: high`
9. **Form Accessibility**: Proper labels and error associations
10. **Semantic HTML**: Using semantic elements (`header`, `main`, `nav`, etc.)

### Testing Accessibility

```bash
# Run with keyboard only
# Tab through all interactive elements
# Ensure focus is visible and logical

# Test with screen reader (macOS VoiceOver)
# Cmd+F5 to toggle VoiceOver
# Navigate and ensure announcements are clear

# Test in high contrast mode
# System Preferences > Accessibility > Display > Increase contrast
```

---

## File Structure

```
frontend/
├── app/
│   ├── globals.css                    # Mobile-responsive styles
│   └── layout.tsx                      # Root layout with providers
├── components/
│   ├── ui/
│   │   ├── LoadingStates.tsx          # Loading components
│   │   ├── ErrorBoundary.tsx          # Error boundary
│   │   └── Toast.tsx                   # Toast notifications
│   ├── TransactionStatus.tsx          # Transaction feedback
│   ├── NotificationCenter.tsx         # Notification system
│   └── site-header.tsx                 # Header with notifications
└── lib/
    ├── errors/
    │   └── ErrorHandler.ts             # Error utilities
    ├── optimistic/
    │   └── updates.ts                  # Optimistic update helpers
    └── ux/
        └── index.ts                    # Centralized exports
```

---

## Best Practices

### 1. Always Show Loading States

```tsx
// Good
{isLoading ? <DashboardCardSkeleton /> : <DashboardCard data={data} />}

// Bad
{!isLoading && <DashboardCard data={data} />}
```

### 2. Handle Errors Gracefully

```tsx
// Good
try {
  await action()
  toast.success('Success!')
} catch (error) {
  const { message } = formatErrorForDisplay(error)
  toast.error(message)
}

// Bad
try {
  await action()
} catch (error) {
  console.error(error)
}
```

### 3. Provide Transaction Feedback

```tsx
// Good
const handleTransaction = async () => {
  setTxState('pending')
  const toastId = toast.txPending('Processing...')

  try {
    const hash = await submitTx()
    toast.removeToast(toastId)
    toast.txSuccess(hash)
    setTxState('success')
  } catch (error) {
    toast.removeToast(toastId)
    toast.txError(error.message)
    setTxState('error')
  }
}

// Bad
const handleTransaction = async () => {
  await submitTx()
}
```

### 4. Use Optimistic Updates for Better UX

```tsx
// Good - immediate feedback
await withOptimisticUpdate(state, setState, {
  optimisticUpdate: (s) => updateState(s),
  mutationFn: () => api.update(),
  rollback: (prev) => prev,
})

// Bad - wait for server
await api.update()
const newData = await api.fetch()
setState(newData)
```

### 5. Mobile-First Development

```tsx
// Good - mobile-first
<div className="px-4 sm:px-6 lg:px-8">
  <Button className="w-full sm:w-auto">
    Action
  </Button>
</div>

// Bad - desktop-first
<div className="px-8 md:px-6 sm:px-4">
  <Button className="w-auto mobile:w-full">
    Action
  </Button>
</div>
```

---

## CSS Utility Classes Reference

### Spacing
- `.px-safe` - Responsive horizontal padding
- `.py-safe` - Responsive vertical padding
- `.container-mobile` - Responsive container

### Typography
- `.text-mobile-sm` - Responsive small text
- `.text-mobile-base` - Responsive base text
- `.text-mobile-lg` - Responsive large text
- `.heading-mobile` - Responsive heading
- `.subheading-mobile` - Responsive subheading

### Layout
- `.grid-mobile` - 1-2-3 column responsive grid
- `.grid-mobile-auto` - 1-2-3-4 column responsive grid
- `.scroll-mobile` - Horizontal scroll on mobile
- `.card-mobile` - Responsive card padding

### Interaction
- `.btn-touch` - Touch-friendly button (min 44px)
- `.shimmer` - Shimmer animation effect

### Visibility
- `.mobile-collapse` - Show on mobile only
- `.mobile-expand` - Hide on mobile

---

## Integration Checklist

- [x] Loading states for all async operations
- [x] Error boundaries at app and section levels
- [x] Toast notifications for user feedback
- [x] Transaction status indicators
- [x] Mobile-responsive design
- [x] Notification center in header
- [x] Optimistic updates for interactions
- [x] Accessibility features (ARIA, keyboard, screen readers)
- [x] Touch-friendly UI elements
- [x] Reduced motion support
- [x] High contrast mode support

---

## Support

For questions or issues with UX components, refer to:
- Component source code in `/frontend/components/`
- Utility source code in `/frontend/lib/`
- This documentation file
