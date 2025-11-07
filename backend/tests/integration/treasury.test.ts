/**
 * Integration tests for Treasury API endpoints
 * Following TDD principles: test all endpoints, happy paths, error cases, and edge cases
 */

import { describe, it, expect, beforeEach, afterAll, jest, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import {
  clearDatabase,
  seedUsers,
  seedTreasuryDeposits,
  seedReimbursementRequests,
  closeTestPool,
  getTestPool,
} from '../helpers/database.helper';
import { testUsers, getAllTestUsers } from '../fixtures/users.fixture';
import { testDeposits, testReimbursementRequests } from '../fixtures/treasury.fixture';
import { createMockTransaction, createMockBalanceResponse } from '../mocks/aptos.mock';

// Mock Aptos SDK
jest.mock('../../src/config/aptos', () => {
  const actual = jest.requireActual('../../src/config/aptos') as any;
  return {
    ...actual,
    aptos: {
      view: jest.fn().mockResolvedValue(createMockBalanceResponse()),
      waitForTransaction: jest.fn().mockResolvedValue(createMockTransaction()),
    },
  };
});

describe('Treasury API Integration Tests', () => {
  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
  });

  afterAll(async () => {
    await closeTestPool();
  });

  describe('GET /api/treasury/balance', () => {
    it('should return current treasury balance', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/balance')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('balance');
      expect(response.body.data).toHaveProperty('balanceFormatted');
      expect(response.body.data).toHaveProperty('coinType');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data.balance).toBe('100000000');
    });

    it('should handle blockchain errors gracefully', async () => {
      // Arrange
      const aptos = require('../../src/config/aptos').aptos;
      aptos.view.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const response = await request(app)
        .get('/api/treasury/balance')
        .expect('Content-Type', /json/)
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch treasury balance');
    });
  });

  describe('GET /api/treasury/transactions', () => {
    beforeEach(async () => {
      await seedTreasuryDeposits(testDeposits);
    });

    it('should return paginated transaction list', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/transactions')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.transactions.length).toBe(4);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should support pagination parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/transactions?page=1&limit=2')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions.length).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should support sorting by ascending order', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/transactions?sort=asc')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      const transactions = response.body.data.transactions;
      // Check that timestamps are in ascending order
      for (let i = 0; i < transactions.length - 1; i++) {
        expect(transactions[i].timestamp).toBeLessThanOrEqual(transactions[i + 1].timestamp);
      }
    });

    it('should support sorting by descending order', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/transactions?sort=desc')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      const transactions = response.body.data.transactions;
      // Check that timestamps are in descending order
      for (let i = 0; i < transactions.length - 1; i++) {
        expect(transactions[i].timestamp).toBeGreaterThanOrEqual(transactions[i + 1].timestamp);
      }
    });

    it('should include formatted amounts', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/transactions')
        .expect(200);

      // Assert
      const transaction = response.body.data.transactions[0];
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('amountFormatted');
      expect(transaction).toHaveProperty('totalBalance');
      expect(transaction).toHaveProperty('totalBalanceFormatted');
    });

    it('should return empty array when no transactions exist', async () => {
      // Arrange
      await clearDatabase();

      // Act
      const response = await request(app)
        .get('/api/treasury/transactions')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/treasury/stats', () => {
    beforeEach(async () => {
      await seedTreasuryDeposits(testDeposits);
      await seedReimbursementRequests(testReimbursementRequests);
    });

    it('should return treasury statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deposits');
      expect(response.body.data).toHaveProperty('reimbursements');
    });

    it('should calculate deposit statistics correctly', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/stats')
        .expect(200);

      // Assert
      const deposits = response.body.data.deposits;
      expect(deposits).toHaveProperty('sponsorTotal');
      expect(deposits).toHaveProperty('merchTotal');
      expect(deposits).toHaveProperty('totalDeposits');
      expect(deposits).toHaveProperty('depositCount');
      expect(deposits.depositCount).toBe(4);
    });

    it('should calculate reimbursement statistics correctly', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/stats')
        .expect(200);

      // Assert
      const reimbursements = response.body.data.reimbursements;
      expect(reimbursements).toHaveProperty('totalRequests');
      expect(reimbursements).toHaveProperty('paidRequests');
      expect(reimbursements).toHaveProperty('pendingRequests');
      expect(reimbursements).toHaveProperty('totalPaid');
      expect(reimbursements).toHaveProperty('totalPending');
      expect(reimbursements.totalRequests).toBe(3);
      expect(reimbursements.paidRequests).toBe(1);
      expect(reimbursements.pendingRequests).toBe(2);
    });

    it('should include formatted amounts in statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/stats')
        .expect(200);

      // Assert
      expect(response.body.data.deposits).toHaveProperty('sponsorTotalFormatted');
      expect(response.body.data.deposits).toHaveProperty('merchTotalFormatted');
      expect(response.body.data.reimbursements).toHaveProperty('totalPaidFormatted');
      expect(response.body.data.reimbursements).toHaveProperty('totalPendingFormatted');
    });

    it('should handle empty statistics correctly', async () => {
      // Arrange
      await clearDatabase();

      // Act
      const response = await request(app)
        .get('/api/treasury/stats')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.deposits.depositCount).toBe(0);
      expect(response.body.data.reimbursements.totalRequests).toBe(0);
    });
  });

  describe('GET /api/treasury/reimbursements', () => {
    beforeEach(async () => {
      await seedReimbursementRequests(testReimbursementRequests);
    });

    it('should return paginated reimbursement list', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/reimbursements')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.requests).toBeInstanceOf(Array);
      expect(response.body.data.requests.length).toBe(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should include user display names', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/reimbursements')
        .expect(200);

      // Assert
      const request_item = response.body.data.requests[0];
      expect(request_item).toHaveProperty('payer_name');
      expect(request_item).toHaveProperty('payee_name');
    });

    it('should include formatted amounts', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/reimbursements')
        .expect(200);

      // Assert
      const request_item = response.body.data.requests[0];
      expect(request_item).toHaveProperty('amount');
      expect(request_item).toHaveProperty('amountFormatted');
    });

    it('should support pagination', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/reimbursements?page=1&limit=2')
        .expect(200);

      // Assert
      expect(response.body.data.requests.length).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/treasury/reimbursements/:id', () => {
    let requestId: number;

    beforeEach(async () => {
      const ids = await seedReimbursementRequests([testReimbursementRequests[0]]);
      requestId = ids[0];
    });

    it('should return specific reimbursement request details', async () => {
      // Act
      const response = await request(app)
        .get(`/api/treasury/reimbursements/${requestId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('payer');
      expect(response.body.data).toHaveProperty('payee');
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('approvals');
    });

    it('should include user display names', async () => {
      // Act
      const response = await request(app)
        .get(`/api/treasury/reimbursements/${requestId}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveProperty('payer_name');
      expect(response.body.data).toHaveProperty('payee_name');
    });

    it('should return 404 for non-existent request', async () => {
      // Act
      const response = await request(app)
        .get('/api/treasury/reimbursements/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Reimbursement request not found');
    });
  });

  describe('POST /api/treasury/reimbursements/submit', () => {
    it('should accept reimbursement submission with transaction hash', async () => {
      // Arrange
      const transactionHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const response = await request(app)
        .post('/api/treasury/reimbursements/submit')
        .send({ transactionHash })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactionHash');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data.success).toBe(true);
    });

    it('should return 400 when transaction hash is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/treasury/reimbursements/submit')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Transaction hash is required');
    });

    it('should handle blockchain errors', async () => {
      // Arrange
      const aptos = require('../../src/config/aptos').aptos;
      aptos.waitForTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      // Act
      const response = await request(app)
        .post('/api/treasury/reimbursements/submit')
        .send({ transactionHash: '0x1234' })
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/treasury/reimbursements/:id/approve', () => {
    let requestId: number;

    beforeEach(async () => {
      const ids = await seedReimbursementRequests([testReimbursementRequests[0]]);
      requestId = ids[0];
    });

    it('should accept approval with transaction hash', async () => {
      // Arrange
      const transactionHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const response = await request(app)
        .post(`/api/treasury/reimbursements/${requestId}/approve`)
        .send({ transactionHash })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactionHash');
      expect(response.body.data).toHaveProperty('version');
    });

    it('should return 400 when transaction hash is missing', async () => {
      // Act
      const response = await request(app)
        .post(`/api/treasury/reimbursements/${requestId}/approve`)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Transaction hash is required');
    });
  });
});
