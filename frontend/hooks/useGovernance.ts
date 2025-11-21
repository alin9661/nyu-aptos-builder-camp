'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getElections,
  getElectionDetails,
  getRoles,
  getMembers,
  getGovernanceStats,
  getCrossChainProposals,
  getProposalWithChainActions,
} from '@/lib/api/governance';
import {
  Election,
  ElectionDetails,
  GovernanceStats,
  Member,
  ElectionFilters,
  Pagination,
  ProposalFilters,
  ProposalWithChainActions,
} from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching elections
 */
export function useElections(filters?: ElectionFilters) {
  const [state, setState] = useState<
    UseDataState<{ elections: Election[]; pagination: Pagination }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchElections = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getElections(filters);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch elections',
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
  }, [filters]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  return { ...state, refetch: fetchElections };
}

/**
 * Hook for fetching specific election details
 */
export function useElectionDetails(electionId: number | null, role: string | null) {
  const [state, setState] = useState<UseDataState<ElectionDetails>>({
    data: null,
    loading: electionId !== null && role !== null,
    error: null,
  });

  const fetchDetails = useCallback(async () => {
    if (electionId === null || role === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getElectionDetails(electionId, role);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch election details',
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
  }, [electionId, role]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { ...state, refetch: fetchDetails };
}

/**
 * Hook for fetching current role assignments
 */
export function useRoles() {
  const [state, setState] = useState<
    UseDataState<Record<string, { address: string; displayName: string }>>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchRoles = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getRoles();

      if (response.success && response.data) {
        setState({ data: response.data.roles, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch roles',
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
    fetchRoles();
  }, [fetchRoles]);

  return { ...state, refetch: fetchRoles };
}

/**
 * Hook for fetching e-board members
 */
export function useMembers() {
  const [state, setState] = useState<UseDataState<Member[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchMembers = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getMembers();

      if (response.success && response.data) {
        setState({ data: response.data.members, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch members',
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
    fetchMembers();
  }, [fetchMembers]);

  return { ...state, refetch: fetchMembers };
}

/**
 * Hook for fetching governance statistics
 */
export function useGovernanceStats(autoRefresh = false, refreshInterval = 60000) {
  const [state, setState] = useState<UseDataState<GovernanceStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getGovernanceStats();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch governance stats',
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
 * Hook for cross-chain proposals (Plan A: Aptos-only, chain-aware types).
 */
export function useCrossChainProposals(
  filters?: ProposalFilters,
  options?: { autoRefresh?: boolean; refreshInterval?: number }
) {
  const autoRefresh = options?.autoRefresh ?? false;
  const refreshInterval = options?.refreshInterval ?? 60000;
  const serializedFilters = JSON.stringify(filters ?? {});
  const normalizedFilters = useMemo(
    () => (filters ? { ...filters } : undefined),
    [serializedFilters]
  );

  const [state, setState] = useState<
    UseDataState<{ proposals: ProposalWithChainActions[]; pagination: Pagination }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchProposals = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await getCrossChainProposals(normalizedFilters);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch cross-chain proposals',
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
  }, [normalizedFilters, serializedFilters]);

  useEffect(() => {
    fetchProposals();

    if (autoRefresh) {
      const interval = setInterval(fetchProposals, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchProposals, autoRefresh, refreshInterval]);

  return { ...state, refetch: fetchProposals };
}

/**
 * Hook for fetching a single proposal with chain actions.
 */
export function useProposalWithChainActions(proposalId: number | null) {
  const [state, setState] = useState<UseDataState<ProposalWithChainActions>>({
    data: null,
    loading: proposalId !== null,
    error: null,
  });

  const fetchDetails = useCallback(async () => {
    if (proposalId === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await getProposalWithChainActions(proposalId);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch proposal actions',
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
  }, [proposalId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { ...state, refetch: fetchDetails };
}
