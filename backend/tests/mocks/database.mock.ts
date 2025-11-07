/**
 * Database mocks for testing
 * Mocks database query responses
 */

import { jest } from '@jest/globals';

/**
 * Create mock query response
 */
export const createMockQueryResponse = <T>(rows: T[]): { rows: T[] } => {
  return { rows };
};

/**
 * Create mock database client
 */
export const createMockDatabaseClient = () => {
  return {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
};

/**
 * Create mock pool
 */
export const createMockPool = () => {
  const mockClient = createMockDatabaseClient();

  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    end: jest.fn(),
    on: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  };
};

/**
 * Mock successful query result
 */
export const mockQuerySuccess = <T>(data: T[]) => {
  return Promise.resolve({ rows: data });
};

/**
 * Mock query error
 */
export const mockQueryError = (message: string) => {
  return Promise.reject(new Error(message));
};

/**
 * Mock empty result
 */
export const mockEmptyResult = () => {
  return Promise.resolve({ rows: [] });
};

/**
 * Mock count query result
 */
export const mockCountResult = (count: number) => {
  return Promise.resolve({ rows: [{ count: count.toString() }] });
};

/**
 * Mock insert result with returning
 */
export const mockInsertResult = <T>(data: T) => {
  return Promise.resolve({ rows: [data] });
};

/**
 * Mock update result
 */
export const mockUpdateResult = (rowCount: number) => {
  return Promise.resolve({ rows: [], rowCount });
};

/**
 * Mock delete result
 */
export const mockDeleteResult = (rowCount: number) => {
  return Promise.resolve({ rows: [], rowCount });
};

/**
 * Database error codes
 */
export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  CONNECTION_EXCEPTION: '08000',
  INVALID_TEXT_REPRESENTATION: '22P02',
} as const;

/**
 * Create database error
 */
export const createDatabaseError = (code: string, message: string) => {
  const error = new Error(message) as any;
  error.code = code;
  return error;
};

/**
 * Mock transaction
 */
export interface MockTransaction {
  query: jest.Mock;
  commit: jest.Mock;
  rollback: jest.Mock;
  release: jest.Mock;
}

export const createMockTransaction = (): MockTransaction => {
  return {
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  };
};

/**
 * Setup mock for testing queries
 */
export const setupQueryMock = (mockPool: any) => {
  const queryMock = mockPool.query as jest.Mock;

  return {
    /**
     * Mock next query response
     */
    mockNext: <T>(data: T[]) => {
      queryMock.mockResolvedValueOnce({ rows: data });
    },

    /**
     * Mock next query error
     */
    mockNextError: (message: string) => {
      queryMock.mockRejectedValueOnce(new Error(message));
    },

    /**
     * Mock all queries
     */
    mockAll: <T>(data: T[]) => {
      queryMock.mockResolvedValue({ rows: data });
    },

    /**
     * Get call count
     */
    getCallCount: (): number => {
      return queryMock.mock.calls.length;
    },

    /**
     * Get last call arguments
     */
    getLastCall: (): any[] => {
      return queryMock.mock.calls[queryMock.mock.calls.length - 1];
    },

    /**
     * Get all calls
     */
    getAllCalls: (): any[][] => {
      return queryMock.mock.calls;
    },

    /**
     * Reset mock
     */
    reset: () => {
      queryMock.mockReset();
    },

    /**
     * Verify query was called with
     */
    verifyCalledWith: (sql: string, params?: any[]) => {
      if (params) {
        expect(queryMock).toHaveBeenCalledWith(sql, params);
      } else {
        expect(queryMock).toHaveBeenCalledWith(expect.stringContaining(sql), expect.anything());
      }
    },
  };
};
