/**
 * Jest setup file - runs after the test environment is set up
 * This file configures global test behaviors and environment variables
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise in tests

// Database configuration for tests
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'nyu_aptos_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.DB_POOL_SIZE = '5'; // Smaller pool for tests

// Aptos configuration for tests
process.env.APTOS_NETWORK = 'testnet';
process.env.MODULE_ADDRESS = '0x1';
process.env.ADVISOR_ADDRESS = '0x2';
process.env.PRESIDENT_ADDRESS = '0x3';
process.env.VICE_ADDRESS = '0x4';
process.env.COIN_TYPE = '0x1::aptos_coin::AptosCoin';

// IPFS configuration for tests (use mock)
process.env.IPFS_HOST = 'localhost';
process.env.IPFS_PORT = '5001';
process.env.IPFS_PROTOCOL = 'http';
process.env.IPFS_GATEWAY = 'https://ipfs.io';

// CORS configuration
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Suppress console output during tests (except errors)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  // Keep error and debug for troubleshooting
  error: console.error,
  debug: console.debug,
};

// Restore console after all tests if needed
afterAll(() => {
  global.console.log = originalConsoleLog;
  global.console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: async (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test addresses
  generateAddress: (prefix = '0x'): string => {
    const randomHex = Math.floor(Math.random() * 1000000).toString(16).padStart(64, '0');
    return `${prefix}${randomHex}`;
  },

  // Helper to generate test transaction hashes
  generateTxHash: (): string => {
    return '0x' + Math.random().toString(16).substring(2).padStart(64, '0');
  },

  // Helper to get current timestamp in seconds
  getCurrentTimestamp: (): number => {
    return Math.floor(Date.now() / 1000);
  }
};

// Extend global namespace for TypeScript
declare global {
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    generateAddress: (prefix?: string) => string;
    generateTxHash: () => string;
    getCurrentTimestamp: () => number;
  };
}

export {};
