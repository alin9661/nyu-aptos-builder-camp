import { apiClient } from './client';
import { ApiResponse, HealthCheck } from '../types/api';

/**
 * Auth & Health API module
 * Handles authentication and health check endpoints
 */

/**
 * Get API health status
 */
export async function getHealthStatus(): Promise<ApiResponse<HealthCheck>> {
  return apiClient.get<HealthCheck>('/health');
}

/**
 * Get API root information
 */
export async function getApiInfo(): Promise<
  ApiResponse<{
    name: string;
    version: string;
    description: string;
    endpoints: Record<string, any>;
  }>
> {
  return apiClient.get('/');
}

// Additional auth-related functions can be added here
// For example:
// - Wallet signature verification
// - Session management
// - User profile endpoints (when implemented on backend)
