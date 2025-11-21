'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTreasuryBalance,
  getTreasuryOverview,
  getTreasuryTransactions,
  getTreasuryStats,
  getReimbursements,
  getReimbursementDetails,
} from '@/lib/api/treasury';
import {
  TreasuryBalance,
  TreasuryOverview,
  Transaction,
  TreasuryStats,
  ReimbursementRequest,
  ReimbursementDetails,
  PaginationParams,
  Pagination,
} from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching the cross-chain treasury overview (Plan A Aptos-only).
 */
export function useTreasuryOverview(autoRefresh = false, refreshInterval = 30000) {
  const [state, setState] = useState<UseDataState<TreasuryOverview>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchOverview = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await getTreasuryOverview();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch treasury overview',
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
    fetchOverview();

    if (autoRefresh) {
      const interval = setInterval(fetchOverview, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchOverview, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchOverview };
}

/**
 * Hook for fetching treasury balance
 */
export function useTreasuryBalance(autoRefresh = false, refreshInterval = 30000) {
  const [state, setState] = useState<UseDataState<TreasuryBalance>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getTreasuryBalance();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch balance',
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
    fetchBalance();

    if (autoRefresh) {
      const interval = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchBalance };
}

/**
 * Hook for fetching treasury transactions
 */
export function useTreasuryTransactions(params?: PaginationParams) {
  const [state, setState] = useState<
    UseDataState<{ transactions: Transaction[]; pagination: Pagination }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getTreasuryTransactions(params);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch transactions',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refetch: fetchTransactions };
}

/**
 * Hook for fetching treasury statistics
 */
export function useTreasuryStats(autoRefresh = false, refreshInterval = 60000) {
  const [state, setState] = useState<UseDataState<TreasuryStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getTreasuryStats();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch stats',
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
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchStats };
}

/**
 * Hook for fetching reimbursement requests
 */
export function useReimbursements(params?: PaginationParams) {
  const [state, setState] = useState<
    UseDataState<{ requests: ReimbursementRequest[]; pagination: Pagination }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchReimbursements = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getReimbursements(params);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch reimbursements',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchReimbursements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refetch: fetchReimbursements };
}

/**
 * Hook for fetching specific reimbursement details
 */
export function useReimbursementDetails(id: number | null) {
  const [state, setState] = useState<UseDataState<ReimbursementDetails>>({
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
      const response = await getReimbursementDetails(id);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch reimbursement details',
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
