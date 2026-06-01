'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/api/notifications';
import {
  Notification,
  NotificationPreferences,
  NotificationFilters,
  Pagination,
} from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and managing notifications
 */
export function useNotifications(filters?: NotificationFilters, autoRefresh = false, refreshInterval = 30000) {
  const [state, setState] = useState<
    UseDataState<{
      notifications: Notification[];
      pagination: Pagination;
    }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  // Stabilize filters object to prevent infinite loops when components pass inline objects
  // This ensures fetchNotifications doesn't recreate when filter contents are the same
  const filtersKey = useMemo(() => (filters ? JSON.stringify(filters) : ''), [filters ? JSON.stringify(filters) : '']);
  const stableFilters = useMemo(() => filters, [filtersKey]);

  const fetchNotifications = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getNotifications(stableFilters);

      if (response.success && response.data) {
        setState({
          data: {
            notifications: response.data.notifications,
            pagination: response.data.pagination,
          },
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch notifications',
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }, [stableFilters]);

  useEffect(() => {
    fetchNotifications();

    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, autoRefresh, refreshInterval]);

  const markNotificationAsRead = useCallback(
    async (id: number) => {
      try {
        const response = await markAsRead(id);
        if (response.success) {
          // Update local state
          setState((prev) => {
            if (!prev.data) return prev;
            return {
              ...prev,
              data: {
                ...prev.data,
                notifications: prev.data.notifications.map((n) =>
                  n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
                ),
              },
            };
          });
        }
        return response;
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        throw error;
      }
    },
    []
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        // Refresh notifications
        await fetchNotifications();
      }
      return response;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, [fetchNotifications]);

  const removeNotification = useCallback(
    async (id: number) => {
      try {
        const response = await deleteNotification(id);
        if (response.success) {
          // Update local state
          setState((prev) => {
            if (!prev.data) return prev;
            return {
              ...prev,
              data: {
                ...prev.data,
                notifications: prev.data.notifications.filter((n) => n.id !== id),
              },
            };
          });
        }
        return response;
      } catch (error) {
        console.error('Failed to delete notification:', error);
        throw error;
      }
    },
    []
  );

  return {
    ...state,
    refetch: fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: removeNotification,
  };
}

/**
 * Hook for fetching unread notification count
 */
export function useUnreadCount(autoRefresh = true, refreshInterval = 10000) {
  const [state, setState] = useState<UseDataState<number>>({
    data: 0,
    loading: true,
    error: null,
  });

  const fetchUnreadCount = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getUnreadCount();

      if (response.success && response.data) {
        setState({
          data: response.data.count,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: 0,
          loading: false,
          error: response.error || 'Failed to fetch unread count',
        });
      }
    } catch (error) {
      setState({
        data: 0,
        loading: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    if (autoRefresh) {
      const interval = setInterval(fetchUnreadCount, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchUnreadCount, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchUnreadCount };
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const [state, setState] = useState<UseDataState<NotificationPreferences>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPreferences = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getNotificationPreferences();

      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch preferences',
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }, []);

  const updatePreferences = useCallback(
    async (preferences: Partial<NotificationPreferences>) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await updateNotificationPreferences(preferences);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: response.error || 'Failed to update preferences',
          }));
        }
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof ApiError
              ? error.message
              : 'An unexpected error occurred',
        }));
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    ...state,
    refetch: fetchPreferences,
    updatePreferences,
  };
}
