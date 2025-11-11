/**
 * Optimistic UI Updates Utility
 * Provides helpers for implementing optimistic updates with rollback on error
 */

import { parseError, logError } from '@/lib/errors/ErrorHandler'

export type OptimisticAction<T> = {
  id: string
  type: string
  data: T
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export type OptimisticUpdateConfig<T, R> = {
  // Optimistic update function (runs immediately)
  optimisticUpdate: (currentState: T) => T
  // Actual async operation
  mutationFn: () => Promise<R>
  // Rollback function (if mutation fails)
  rollback: (previousState: T) => T
  // Success callback (optional)
  onSuccess?: (data: R, updatedState: T) => T
  // Error callback (optional)
  onError?: (error: unknown, previousState: T) => void
}

/**
 * Execute an optimistic update with automatic rollback on error
 */
export async function withOptimisticUpdate<T, R>(
  currentState: T,
  setState: (state: T | ((prev: T) => T)) => void,
  config: OptimisticUpdateConfig<T, R>
): Promise<R> {
  const previousState = currentState

  try {
    // 1. Apply optimistic update immediately
    const optimisticState = config.optimisticUpdate(currentState)
    setState(optimisticState)

    // 2. Perform actual mutation
    const result = await config.mutationFn()

    // 3. Apply success update if provided
    if (config.onSuccess) {
      const confirmedState = config.onSuccess(result, optimisticState)
      setState(confirmedState)
    }

    return result
  } catch (error) {
    // 4. Rollback to previous state on error
    const rolledBackState = config.rollback(previousState)
    setState(rolledBackState)

    // 5. Log error and call error callback
    const parsedError = parseError(error)
    logError(parsedError)
    config.onError?.(error, previousState)

    throw error
  }
}

/**
 * Optimistic state manager for React
 * Manages a queue of optimistic actions with state reconciliation
 */
export class OptimisticStateManager<T> {
  private state: T
  private pendingActions: Map<string, OptimisticAction<unknown>>
  private setState: (state: T) => void

  constructor(initialState: T, setState: (state: T) => void) {
    this.state = initialState
    this.setState = setState
    this.pendingActions = new Map()
  }

  /**
   * Add an optimistic action
   */
  addAction<D>(type: string, data: D, updater: (state: T) => T): string {
    const id = this.generateId()
    const action: OptimisticAction<D> = {
      id,
      type,
      data,
      timestamp: new Date(),
      status: 'pending',
    }

    this.pendingActions.set(id, action)
    this.state = updater(this.state)
    this.setState(this.state)

    return id
  }

  /**
   * Confirm an action (remove from pending)
   */
  confirmAction(id: string, updater?: (state: T) => T): void {
    const action = this.pendingActions.get(id)
    if (action) {
      action.status = 'confirmed'
      this.pendingActions.delete(id)

      if (updater) {
        this.state = updater(this.state)
        this.setState(this.state)
      }
    }
  }

  /**
   * Rollback an action
   */
  rollbackAction(id: string, rollbackFn: (state: T) => T): void {
    const action = this.pendingActions.get(id)
    if (action) {
      action.status = 'failed'
      this.pendingActions.delete(id)
      this.state = rollbackFn(this.state)
      this.setState(this.state)
    }
  }

  /**
   * Get pending actions
   */
  getPendingActions(): OptimisticAction<unknown>[] {
    return Array.from(this.pendingActions.values())
  }

  /**
   * Clear all pending actions
   */
  clearPendingActions(): void {
    this.pendingActions.clear()
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}

/**
 * React Hook for optimistic updates
 */
export function createOptimisticHook<T>() {
  return function useOptimistic(
    initialState: T
  ): [
    T,
    (updater: (state: T) => T) => void,
    {
      addAction: <D>(type: string, data: D, updater: (state: T) => T) => string
      confirmAction: (id: string, updater?: (state: T) => T) => void
      rollbackAction: (id: string, rollbackFn: (state: T) => T) => void
      getPendingActions: () => OptimisticAction<unknown>[]
    }
  ] {
    const [state, setState] = React.useState<T>(initialState)
    const managerRef = React.useRef<OptimisticStateManager<T>>()

    if (!managerRef.current) {
      managerRef.current = new OptimisticStateManager(initialState, setState)
    }

    const addAction = React.useCallback(
      <D>(type: string, data: D, updater: (state: T) => T) => {
        return managerRef.current!.addAction(type, data, updater)
      },
      []
    )

    const confirmAction = React.useCallback((id: string, updater?: (state: T) => T) => {
      managerRef.current!.confirmAction(id, updater)
    }, [])

    const rollbackAction = React.useCallback((id: string, rollbackFn: (state: T) => T) => {
      managerRef.current!.rollbackAction(id, rollbackFn)
    }, [])

    const getPendingActions = React.useCallback(() => {
      return managerRef.current!.getPendingActions()
    }, [])

    return [
      state,
      setState,
      {
        addAction,
        confirmAction,
        rollbackAction,
        getPendingActions,
      },
    ]
  }
}

/**
 * Helper for list item optimistic updates
 */
export const listOptimisticHelpers = {
  /**
   * Optimistically add an item to a list
   */
  addItem: <T extends { id: string }>(list: T[], item: T): T[] => {
    return [item, ...list]
  },

  /**
   * Optimistically update an item in a list
   */
  updateItem: <T extends { id: string }>(
    list: T[],
    id: string,
    updater: (item: T) => Partial<T>
  ): T[] => {
    return list.map((item) => (item.id === id ? { ...item, ...updater(item) } : item))
  },

  /**
   * Optimistically remove an item from a list
   */
  removeItem: <T extends { id: string }>(list: T[], id: string): T[] => {
    return list.filter((item) => item.id !== id)
  },

  /**
   * Rollback add operation
   */
  rollbackAdd: <T extends { id: string }>(list: T[], tempId: string): T[] => {
    return list.filter((item) => item.id !== tempId)
  },

  /**
   * Rollback update operation
   */
  rollbackUpdate: <T extends { id: string }>(list: T[], id: string, originalItem: T): T[] => {
    return list.map((item) => (item.id === id ? originalItem : item))
  },

  /**
   * Rollback remove operation
   */
  rollbackRemove: <T extends { id: string }>(list: T[], item: T): T[] => {
    return [item, ...list]
  },
}

/**
 * Helper for object property optimistic updates
 */
export const objectOptimisticHelpers = {
  /**
   * Optimistically update a property
   */
  updateProperty: <T extends object, K extends keyof T>(
    obj: T,
    key: K,
    value: T[K]
  ): T => {
    return { ...obj, [key]: value }
  },

  /**
   * Optimistically update multiple properties
   */
  updateProperties: <T extends object>(obj: T, updates: Partial<T>): T => {
    return { ...obj, ...updates }
  },

  /**
   * Rollback property update
   */
  rollbackProperty: <T extends object, K extends keyof T>(
    obj: T,
    key: K,
    originalValue: T[K]
  ): T => {
    return { ...obj, [key]: originalValue }
  },
}

/**
 * Example usage patterns
 */

// Example 1: Simple optimistic update
export async function exampleSimpleUpdate<T>(
  currentState: T[],
  setState: (state: T[]) => void,
  newItem: T,
  apiCall: () => Promise<T>
) {
  await withOptimisticUpdate(
    currentState,
    setState,
    {
      optimisticUpdate: (state) => [newItem, ...state],
      mutationFn: apiCall,
      rollback: (previousState) => previousState,
      onSuccess: (confirmedItem, state) => {
        // Replace temp item with confirmed item from server
        return [confirmedItem, ...state.slice(1)]
      },
    }
  )
}

// Example 2: Vote on proposal (optimistic increment)
export async function exampleVoteOptimistic(
  proposals: Array<{ id: string; votes: number }>,
  setProposals: (proposals: Array<{ id: string; votes: number }>) => void,
  proposalId: string,
  voteApi: () => Promise<void>
) {
  const originalProposal = proposals.find((p) => p.id === proposalId)
  if (!originalProposal) return

  await withOptimisticUpdate(
    proposals,
    setProposals,
    {
      optimisticUpdate: (state) =>
        state.map((p) => (p.id === proposalId ? { ...p, votes: p.votes + 1 } : p)),
      mutationFn: voteApi,
      rollback: (previousState) => previousState,
      onError: (error) => {
        console.error('Vote failed:', error)
      },
    }
  )
}

// Need to import React for the hook
import * as React from 'react'
