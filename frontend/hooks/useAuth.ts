'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHealthStatus, getApiInfo } from '@/lib/api/auth';
import { HealthCheck } from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for checking API health status
 */
export function useHealthCheck(autoCheck = true, checkInterval = 60000) {
  const [state, setState] = useState<UseDataState<HealthCheck>>({
    data: null,
    loading: true,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getHealthStatus();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Health check failed',
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

  useEffect(() => {
    if (autoCheck) {
      checkHealth();
      const interval = setInterval(checkHealth, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, autoCheck, checkInterval]);

  return { ...state, checkHealth };
}

/**
 * Hook for getting API information
 */
export function useApiInfo() {
  const [state, setState] = useState<
    UseDataState<{
      name: string;
      version: string;
      description: string;
      endpoints: Record<string, any>;
    }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchInfo = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getApiInfo();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch API info',
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

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  return { ...state, refetch: fetchInfo };
}
