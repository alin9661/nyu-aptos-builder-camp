'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getConsentStatus,
  grantConsent,
  revokeConsent,
  getAuditTrail,
  exportUserData,
  downloadDataExport,
  requestDataDeletion,
  getComplianceInfo,
} from '@/lib/api/compliance';
import {
  ConsentStatus,
  ConsentType,
  AuditLogEntry,
  AuditFilters,
  Pagination,
} from '@/lib/types/api';
import { ApiError } from '@/lib/api/client';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing user consent status
 */
export function useConsentStatus() {
  const [state, setState] = useState<UseDataState<ConsentStatus>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchConsentStatus = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getConsentStatus();

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
          error: response.error || 'Failed to fetch consent status',
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

  const grantConsentType = useCallback(
    async (type: ConsentType, version: string = '1.0') => {
      try {
        const response = await grantConsent(type, version);
        if (response.success) {
          // Refresh consent status
          await fetchConsentStatus();
        }
        return response;
      } catch (error) {
        console.error('Failed to grant consent:', error);
        throw error;
      }
    },
    [fetchConsentStatus]
  );

  const revokeConsentType = useCallback(
    async (type: ConsentType) => {
      try {
        const response = await revokeConsent(type);
        if (response.success) {
          // Refresh consent status
          await fetchConsentStatus();
        }
        return response;
      } catch (error) {
        console.error('Failed to revoke consent:', error);
        throw error;
      }
    },
    [fetchConsentStatus]
  );

  useEffect(() => {
    fetchConsentStatus();
  }, [fetchConsentStatus]);

  return {
    ...state,
    refetch: fetchConsentStatus,
    grantConsent: grantConsentType,
    revokeConsent: revokeConsentType,
  };
}

/**
 * Hook for accessing audit trail
 */
export function useAuditTrail(filters?: AuditFilters) {
  const [state, setState] = useState<
    UseDataState<{
      audit_logs: AuditLogEntry[];
      pagination: Pagination;
    }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchAuditTrail = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getAuditTrail(filters);

      if (response.success && response.data) {
        setState({
          data: {
            audit_logs: response.data.audit_logs,
            pagination: response.data.pagination,
          },
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch audit trail',
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
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  return {
    ...state,
    refetch: fetchAuditTrail,
  };
}

/**
 * Hook for data export functionality
 */
export function useDataExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(
    async (format: 'json' | 'csv' | 'xml' = 'json') => {
      try {
        setExporting(true);
        setError(null);
        await downloadDataExport(format);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to export data';
        setError(errorMessage);
        throw err;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return {
    exporting,
    error,
    exportData,
  };
}

/**
 * Hook for data deletion functionality
 */
export function useDataDeletion() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteData = useCallback(async (confirmation: string) => {
    try {
      setDeleting(true);
      setError(null);
      const response = await requestDataDeletion(confirmation);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to request data deletion';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    deleting,
    error,
    deleteData,
  };
}

/**
 * Hook for compliance information
 */
export function useComplianceInfo() {
  const [state, setState] = useState<
    UseDataState<{
      user_rights: string[];
      contact_info: any;
      data_categories: string[];
      retention_periods: Record<string, string>;
    }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchComplianceInfo = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getComplianceInfo();

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
          error: response.error || 'Failed to fetch compliance info',
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
    fetchComplianceInfo();
  }, [fetchComplianceInfo]);

  return {
    ...state,
    refetch: fetchComplianceInfo,
  };
}
