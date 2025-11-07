/**
 * Integration tests for Proposals API endpoints
 * Testing proposal creation, voting, and querying with TDD principles
 */

import { describe, it, expect, beforeEach, afterAll, jest, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import {
  clearDatabase,
  seedUsers,
  seedProposals,
  closeTestPool,
} from '../helpers/database.helper';
import { testUsers, getAllTestUsers } from '../fixtures/users.fixture';
import { testProposals, PROPOSAL_STATUS } from '../fixtures/proposals.fixture';
import { createMockTransaction } from '../mocks/aptos.mock';

// Mock Aptos SDK
jest.mock('../../src/config/aptos');

describe('Proposals API Integration Tests', () => {
  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
    const aptos = require('../../src/config/aptos').aptos;
    aptos.waitForTransaction = jest.fn().mockResolvedValue(createMockTransaction());
  });

  afterAll(async () => {
    await closeTestPool();
  });

  describe('GET /api/proposals', () => {
    beforeEach(async () => {
      await seedProposals(testProposals);
    });

    it('should return paginated proposal list', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.proposals).toBeInstanceOf(Array);
      expect(response.body.data.proposals.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should include proposal status names', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals')
        .expect(200);

      // Assert
      const proposal = response.body.data.proposals[0];
      expect(proposal).toHaveProperty('statusName');
      expect(typeof proposal.statusName).toBe('string');
    });

    it('should include vote statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals')
        .expect(200);

      // Assert
      const proposal = response.body.data.proposals[0];
      expect(proposal).toHaveProperty('voteStats');
      expect(proposal.voteStats).toHaveProperty('totalVoters');
      expect(proposal.voteStats).toHaveProperty('yayVoters');
      expect(proposal.voteStats).toHaveProperty('nayVoters');
    });

    it('should filter proposals by status', async () => {
      // Act - filter for active proposals
      const response = await request(app)
        .get(`/api/proposals?status=${PROPOSAL_STATUS.ACTIVE}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      response.body.data.proposals.forEach((proposal: any) => {
        expect(proposal.status).toBe(PROPOSAL_STATUS.ACTIVE);
      });
    });

    it('should filter proposals by creator', async () => {
      // Act
      const response = await request(app)
        .get(`/api/proposals?creator=${testUsers.president.address}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      response.body.data.proposals.forEach((proposal: any) => {
        expect(proposal.creator).toBe(testUsers.president.address);
      });
    });

    it('should support pagination', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals?page=1&limit=2')
        .expect(200);

      // Assert
      expect(response.body.data.proposals.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/proposals/:id', () => {
    beforeEach(async () => {
      await seedProposals([testProposals[0]]);
    });

    it('should return specific proposal details', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/1')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('proposal_id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('votes');
      expect(response.body.data).toHaveProperty('voteStats');
    });

    it('should include creator name', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/1')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveProperty('creator_name');
    });

    it('should include detailed vote statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/1')
        .expect(200);

      // Assert
      const voteStats = response.body.data.voteStats;
      expect(voteStats).toHaveProperty('totalVoters');
      expect(voteStats).toHaveProperty('yayVoters');
      expect(voteStats).toHaveProperty('nayVoters');
      expect(voteStats).toHaveProperty('yayWeight');
      expect(voteStats).toHaveProperty('nayWeight');
    });

    it('should return 404 for non-existent proposal', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/99999')
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Proposal not found');
    });
  });

  describe('GET /api/proposals/status/active', () => {
    beforeEach(async () => {
      await seedProposals(testProposals);
    });

    it('should return only active proposals', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/status/active')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.proposals).toBeInstanceOf(Array);
      response.body.data.proposals.forEach((proposal: any) => {
        expect(proposal.status).toBe(PROPOSAL_STATUS.ACTIVE);
      });
    });

    it('should only return proposals within voting window', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/status/active')
        .expect(200);

      // Assert
      const now = Math.floor(Date.now() / 1000);
      response.body.data.proposals.forEach((proposal: any) => {
        expect(proposal.start_ts).toBeLessThanOrEqual(now);
        expect(proposal.end_ts).toBeGreaterThan(now);
      });
    });

    it('should include vote statistics for active proposals', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/status/active')
        .expect(200);

      // Assert
      if (response.body.data.proposals.length > 0) {
        const proposal = response.body.data.proposals[0];
        expect(proposal).toHaveProperty('voteStats');
      }
    });
  });

  describe('GET /api/proposals/stats/overview', () => {
    beforeEach(async () => {
      await seedProposals(testProposals);
    });

    it('should return proposal statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/stats/overview')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('proposals');
      expect(response.body.data).toHaveProperty('votes');
      expect(response.body.data).toHaveProperty('recentProposals');
    });

    it('should include proposal counts by status', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/stats/overview')
        .expect(200);

      // Assert
      const stats = response.body.data.proposals;
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('passed');
      expect(stats).toHaveProperty('rejected');
      expect(stats).toHaveProperty('executed');
    });

    it('should include vote statistics', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/stats/overview')
        .expect(200);

      // Assert
      const voteStats = response.body.data.votes;
      expect(voteStats).toHaveProperty('uniqueVoters');
      expect(voteStats).toHaveProperty('totalVotes');
      expect(voteStats).toHaveProperty('totalYay');
      expect(voteStats).toHaveProperty('totalNay');
    });

    it('should include recent proposals list', async () => {
      // Act
      const response = await request(app)
        .get('/api/proposals/stats/overview')
        .expect(200);

      // Assert
      const recent = response.body.data.recentProposals;
      expect(recent).toBeInstanceOf(Array);
      expect(recent.length).toBeLessThanOrEqual(5);
      if (recent.length > 0) {
        expect(recent[0]).toHaveProperty('proposal_id');
        expect(recent[0]).toHaveProperty('title');
        expect(recent[0]).toHaveProperty('statusName');
      }
    });
  });

  describe('POST /api/proposals/create', () => {
    it('should accept proposal creation with transaction hash', async () => {
      // Arrange
      const transactionHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const response = await request(app)
        .post('/api/proposals/create')
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
        .post('/api/proposals/create')
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
        .post('/api/proposals/create')
        .send({ transactionHash: '0x1234' })
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to process proposal creation');
    });
  });

  describe('POST /api/proposals/:id/vote', () => {
    beforeEach(async () => {
      await seedProposals([testProposals[2]]); // Active proposal
    });

    it('should accept vote with transaction hash', async () => {
      // Arrange
      const transactionHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const response = await request(app)
        .post('/api/proposals/3/vote')
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
        .post('/api/proposals/3/vote')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Transaction hash is required');
    });

    it('should handle blockchain errors', async () => {
      // Arrange
      const aptos = require('../../src/config/aptos').aptos;
      aptos.waitForTransaction.mockRejectedValueOnce(new Error('Vote failed'));

      // Act
      const response = await request(app)
        .post('/api/proposals/3/vote')
        .send({ transactionHash: '0x1234' })
        .expect(500);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid pagination parameters gracefully', async () => {
      // Arrange
      await seedProposals(testProposals);

      // Act
      const response = await request(app)
        .get('/api/proposals?page=-1&limit=0')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.proposals).toBeInstanceOf(Array);
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking database to simulate errors
      // Skipping for now, but in production you'd want this
    });

    it('should sanitize user inputs', async () => {
      // Arrange
      await seedProposals(testProposals);

      // Act - attempt SQL injection
      const response = await request(app)
        .get("/api/proposals?creator='; DROP TABLE proposals; --")
        .expect(200);

      // Assert - should not crash, should return empty results
      expect(response.body.success).toBe(true);
    });
  });
});
