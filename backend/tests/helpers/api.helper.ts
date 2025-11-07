/**
 * API request helper for integration tests
 * Provides utilities for making authenticated and unauthenticated requests
 */

import request from 'supertest';
import express, { Application } from 'express';
import { generateAccessToken } from '../../src/utils/jwt';

/**
 * Create test request helper with optional authentication
 */
export class ApiHelper {
  private app: Application;
  private token?: string;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Set authentication token for requests
   */
  authenticate(address: string, role: string): this {
    this.token = generateAccessToken(address, role);
    return this;
  }

  /**
   * Clear authentication
   */
  clearAuth(): this {
    this.token = undefined;
    return this;
  }

  /**
   * Make GET request
   */
  get(url: string) {
    const req = request(this.app).get(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    return req;
  }

  /**
   * Make POST request
   */
  post(url: string, data?: any) {
    const req = request(this.app).post(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make PUT request
   */
  put(url: string, data?: any) {
    const req = request(this.app).put(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make DELETE request
   */
  delete(url: string) {
    const req = request(this.app).delete(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    return req;
  }

  /**
   * Make PATCH request
   */
  patch(url: string, data?: any) {
    const req = request(this.app).patch(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Upload file
   */
  uploadFile(url: string, fieldName: string, fileBuffer: Buffer, filename: string) {
    const req = request(this.app).post(url);
    if (this.token) {
      req.set('Authorization', `Bearer ${this.token}`);
    }
    req.attach(fieldName, fileBuffer, filename);
    return req;
  }
}

/**
 * Create API helper for testing
 */
export const createApiHelper = (app: Application): ApiHelper => {
  return new ApiHelper(app);
};

/**
 * Test roles for authentication
 */
export const TEST_ROLES = {
  ADMIN: 'admin',
  ADVISOR: 'advisor',
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  EBOARD_MEMBER: 'eboard_member',
  MEMBER: 'member',
} as const;

/**
 * Test addresses
 */
export const TEST_ADDRESSES = {
  ADMIN: '0x1000000000000000000000000000000000000000000000000000000000000001',
  ADVISOR: '0x2000000000000000000000000000000000000000000000000000000000000002',
  PRESIDENT: '0x3000000000000000000000000000000000000000000000000000000000000003',
  VICE_PRESIDENT: '0x4000000000000000000000000000000000000000000000000000000000000004',
  EBOARD: '0x5000000000000000000000000000000000000000000000000000000000000005',
  MEMBER: '0x6000000000000000000000000000000000000000000000000000000000000006',
  UNAUTHORIZED: '0x7000000000000000000000000000000000000000000000000000000000000007',
} as const;

/**
 * Helper to expect successful JSON response
 */
export const expectSuccess = (response: request.Response) => {
  expect(response.status).toBeLessThan(400);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
  return response.body.data;
};

/**
 * Helper to expect error response
 */
export const expectError = (response: request.Response, status: number) => {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  return response.body.error;
};

/**
 * Helper to expect validation error
 */
export const expectValidationError = (response: request.Response) => {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error', 'Validation error');
  expect(response.body).toHaveProperty('details');
  expect(Array.isArray(response.body.details)).toBe(true);
  return response.body.details;
};

/**
 * Helper to expect unauthorized error
 */
export const expectUnauthorized = (response: request.Response) => {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
};

/**
 * Helper to expect forbidden error
 */
export const expectForbidden = (response: request.Response) => {
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
};

/**
 * Helper to expect not found error
 */
export const expectNotFound = (response: request.Response) => {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('success', false);
  return response.body;
};

/**
 * Helper to create pagination query string
 */
export const paginationQuery = (page = 1, limit = 20, sort = 'desc'): string => {
  return `?page=${page}&limit=${limit}&sort=${sort}`;
};

/**
 * Helper to wait for async operations
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Helper to retry async operation
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await waitFor(delayMs);
    }
  }
  throw new Error('Max retries exceeded');
};
