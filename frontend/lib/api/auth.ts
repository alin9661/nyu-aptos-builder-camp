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

/**
 * Request a nonce for wallet signature authentication
 */
export async function requestWalletNonce(address: string): Promise<ApiResponse<{
  nonce: string;
  message: string;
  address: string;
}>> {
  return apiClient.post('/api/auth/nonce', { address });
}

/**
 * Authenticate with wallet signature
 */
export async function loginWithWallet(params: {
  address: string;
  message: string;
  signature: string;
  publicKey: string;
}): Promise<ApiResponse<{
  user: {
    address: string;
    role: string;
    displayName?: string;
    email?: string;
  };
  accessToken: string;
  refreshToken: string;
}>> {
  return apiClient.post('/api/auth/login', params);
}

/**
 * Verify JWT token validity
 */
export async function verifyToken(token?: string): Promise<ApiResponse<{
  valid: boolean;
  user?: {
    address: string;
    role: string;
  };
}>> {
  return apiClient.post('/api/auth/verify', { token });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<ApiResponse<{
  accessToken: string;
}>> {
  return apiClient.post('/api/auth/refresh', { refreshToken });
}
