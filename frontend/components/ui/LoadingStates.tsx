'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Spinner variants
type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'size-4 border-2',
    md: 'size-6 border-2',
    lg: 'size-8 border-3',
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function ButtonSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('mr-2', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Loading Overlay
interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ message = 'Loading...', className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && <p className="text-sm font-medium">{message}</p>}
      </div>
    </div>
  )
}

// Inline Loading
interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text = 'Loading...', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size="sm" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

// Skeleton Components with Shimmer Effect
export function DashboardCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3 shimmer" />
        <Skeleton className="h-8 w-1/2 shimmer" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full shimmer" />
          <Skeleton className="h-3 w-5/6 shimmer" />
        </div>
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 shimmer" />
          <Skeleton className="h-8 w-24 shimmer" />
        </div>
        <Skeleton className="size-12 rounded-full shimmer" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-3 w-32 shimmer" />
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <Skeleton className="size-10 shrink-0 rounded-full shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 shimmer" />
        <Skeleton className="h-3 w-1/2 shimmer" />
      </div>
      <Skeleton className="h-8 w-20 shimmer" />
    </div>
  )
}

interface ListSkeletonProps {
  count?: number
  className?: string
}

export function ListSkeleton({ count = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-4 w-1/4 shimmer" />
        <Skeleton className="h-4 w-1/4 shimmer" />
        <Skeleton className="h-4 w-1/4 shimmer" />
        <Skeleton className="h-4 w-1/4 shimmer" />
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-1/4 shimmer" />
          <Skeleton className="h-4 w-1/4 shimmer" />
          <Skeleton className="h-4 w-1/4 shimmer" />
          <Skeleton className="h-4 w-1/4 shimmer" />
        </div>
      ))}
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32 shimmer" />
        <Skeleton className="h-4 w-24 shimmer" />
      </div>
      <div className="flex h-[300px] items-end gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="shimmer flex-1"
            style={{ height: `${Math.random() * 70 + 30}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8 shimmer" />
        ))}
      </div>
    </div>
  )
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 shimmer" />
        <Skeleton className="h-10 w-full shimmer" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 shimmer" />
        <Skeleton className="h-10 w-full shimmer" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 shimmer" />
        <Skeleton className="h-24 w-full shimmer" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24 shimmer" />
        <Skeleton className="h-10 w-24 shimmer" />
      </div>
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-16 shrink-0 rounded-full shimmer" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 shimmer" />
        <Skeleton className="h-3 w-48 shimmer" />
      </div>
    </div>
  )
}
