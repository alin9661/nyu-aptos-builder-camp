'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProposals,
  getProposalDetails,
  getActiveProposals,
  getProposalStats,
} from '@/lib/api/proposals';
import {
  Proposal,
  ProposalDetails,
  ProposalStats,
  ProposalFilters,
  Pagination,
} from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching proposals
 */
export function useProposals(filters?: ProposalFilters) {
  const [state, setState] = useState<
    UseDataState<{ proposals: Proposal[]; pagination: Pagination }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  // Stabilize filters object to prevent infinite loops
  const stableFilters = useMemo(() => filters, [
    filters?.page,
    filters?.limit,
    filters?.sort,
    filters?.status,
    filters?.category,
  ]);

  const fetchProposals = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getProposals(stableFilters);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch proposals',
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
    fetchProposals();
  }, [fetchProposals]);

  return { ...state, refetch: fetchProposals };
}

/**
 * Hook for fetching specific proposal details
 */
export function useProposalDetails(id: number | null) {
  const [state, setState] = useState<UseDataState<ProposalDetails>>({
    data: null,
    loading: id !== null,
    error: null,
  });

  const fetchDetails = useCallback(async () => {
    if (id === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getProposalDetails(id);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch proposal details',
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
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { ...state, refetch: fetchDetails };
}

/**
 * Hook for fetching active proposals
 */
export function useActiveProposals(autoRefresh = false, refreshInterval = 30000) {
  const [state, setState] = useState<
    UseDataState<{ proposals: Proposal[]; count: number }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchActive = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getActiveProposals();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch active proposals',
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

  // Initial fetch
  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // Auto-refresh setup (separate effect to avoid triggering on param changes)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchActive, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchActive]);

  return { ...state, refetch: fetchActive };
}

/**
 * Hook for fetching proposal statistics
 */
export function useProposalStats(autoRefresh = false, refreshInterval = 60000) {
  const [state, setState] = useState<UseDataState<ProposalStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getProposalStats();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch proposal stats',
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

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh setup (separate effect to avoid triggering on param changes)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStats]);

  return { ...state, refetch: fetchStats };
}
