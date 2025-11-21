import { apiClient } from './client';
import {
  ApiResponse,
  ConsentType,
  ConsentRecord,
  ConsentStatus,
  AuditLogEntry,
  AuditFilters,
  DataExport,
  PaginatedResponse,
} from '../types/api';

/**
 * Compliance & GDPR API module
 * Handles all compliance-related operations
 */

// ===== Consent Management (GDPR Article 7) =====

/**
 * Grant consent for a specific type of data processing
 */
export async function grantConsent(
  type: ConsentType,
  version: string = '1.0'
): Promise<ApiResponse<ConsentRecord>> {
  return apiClient.post<ConsentRecord>('/api/compliance/consent', {
    consent_type: type,
    version,
  });
}

/**
 * Revoke consent for a specific type
 */
export async function revokeConsent(type: ConsentType): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/api/compliance/consent/${type}`);
}

/**
 * Get current consent status for all types
 */
export async function getConsentStatus(): Promise<ApiResponse<ConsentStatus>> {
  return apiClient.get<ConsentStatus>('/api/compliance/consent/status');
}

/**
 * Get available consent types
 */
export async function getConsentTypes(): Promise<ApiResponse<ConsentType[]>> {
  return apiClient.get<ConsentType[]>('/api/compliance/consent-types');
}

// ===== Data Export (GDPR Article 20) =====

/**
 * Export all user data in specified format
 */
export async function exportUserData(
  format: 'json' | 'csv' | 'xml' = 'json'
): Promise<ApiResponse<DataExport | Blob>> {
  if (format === 'json') {
    return apiClient.get<DataExport>('/api/compliance/data/export/json');
  } else {
    // For CSV/XML, return blob
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/compliance/data/export?format=${format}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }
    const blob = await response.blob();
    return {
      success: true,
      data: blob as any,
    };
  }
}

/**
 * Download exported data as file
 */
export async function downloadDataExport(format: 'json' | 'csv' | 'xml' = 'json'): Promise<void> {
  const response = await exportUserData(format);
  if (!response.success || !response.data) {
    throw new Error('Failed to export data');
  }

  let blob: Blob;
  let filename: string;

  if (format === 'json') {
    const jsonString = JSON.stringify(response.data, null, 2);
    blob = new Blob([jsonString], { type: 'application/json' });
    filename = `user-data-export-${Date.now()}.json`;
  } else {
    blob = response.data as any as Blob;
    filename = `user-data-export-${Date.now()}.${format}`;
  }

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== Data Deletion (GDPR Article 17) =====

/**
 * Request deletion of all user data
 */
export async function requestDataDeletion(
  confirmation: string
): Promise<ApiResponse<{ scheduled_for: string }>> {
  return apiClient.post<{ scheduled_for: string }>('/api/compliance/data/delete', {
    confirmation,
  });
}

// ===== Data Rectification (GDPR Article 16) =====

/**
 * Update/rectify user data
 */
export async function rectifyUserData(
  updates: Record<string, any>
): Promise<ApiResponse<any>> {
  return apiClient.put<any>('/api/compliance/data/rectify', updates);
}

// ===== Audit Trail (GDPR Article 15) =====

/**
 * Get user's audit trail with optional filters
 */
export async function getAuditTrail(
  filters?: AuditFilters
): Promise<PaginatedResponse<AuditLogEntry>> {
  return apiClient.get<{
    audit_logs: AuditLogEntry[];
    pagination: any;
  }>('/api/compliance/audit-trail', {
    params: filters,
  });
}

// ===== Information =====

/**
 * Get compliance information and user rights
 */
export async function getComplianceInfo(): Promise<
  ApiResponse<{
    user_rights: string[];
    contact_info: any;
    data_categories: string[];
    retention_periods: Record<string, string>;
  }>
> {
  return apiClient.get('/api/compliance/info');
}
