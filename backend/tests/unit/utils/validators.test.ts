/**
 * Unit tests for validators utility
 * Tests validation schemas and middleware functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Joi from 'joi';
import {
  reimbursementSubmitSchema,
  reimbursementApprovalSchema,
  proposalCreateSchema,
  voteSchema,
  electionVoteSchema,
  paginationSchema,
  validateQuery,
  validateBody,
  isValidAptosAddress,
} from '../../../src/utils/validators';

describe('Validators', () => {
  describe('isValidAptosAddress', () => {
    it('should validate correct Aptos address with 0x prefix', () => {
      const validAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidAptosAddress(validAddress)).toBe(true);
    });

    it('should validate correct Aptos address with short form', () => {
      const shortAddress = '0x1';
      expect(isValidAptosAddress(shortAddress)).toBe(true);
    });

    it('should reject address without 0x prefix', () => {
      const invalidAddress = '1234567890abcdef';
      expect(isValidAptosAddress(invalidAddress)).toBe(false);
    });

    it('should reject address with invalid characters', () => {
      const invalidAddress = '0xGHIJKL';
      expect(isValidAptosAddress(invalidAddress)).toBe(false);
    });

    it('should reject address longer than 64 hex chars', () => {
      const tooLong = '0x' + '1'.repeat(65);
      expect(isValidAptosAddress(tooLong)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidAptosAddress('')).toBe(false);
    });

    it('should accept uppercase hex characters', () => {
      const upperCase = '0x1234ABCD';
      expect(isValidAptosAddress(upperCase)).toBe(true);
    });

    it('should accept mixed case hex characters', () => {
      const mixedCase = '0x1234AbCd';
      expect(isValidAptosAddress(mixedCase)).toBe(true);
    });
  });

  describe('reimbursementSubmitSchema', () => {
    const validData = {
      payee: '0x123',
      amount: 100,
      invoice_uri: 'https://example.com/invoice.pdf',
      invoice_hash: 'abc123',
    };

    it('should validate correct reimbursement submission data', () => {
      const result = reimbursementSubmitSchema.validate(validData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validData);
    });

    it('should reject submission without payee', () => {
      const { payee, ...dataWithoutPayee } = validData;
      const result = reimbursementSubmitSchema.validate(dataWithoutPayee);
      expect(result.error).toBeDefined();
    });

    it('should reject submission with invalid payee address', () => {
      const invalidData = { ...validData, payee: 'invalid-address' };
      const result = reimbursementSubmitSchema.validate(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid Aptos address');
    });

    it('should reject submission with negative amount', () => {
      const invalidData = { ...validData, amount: -100 };
      const result = reimbursementSubmitSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject submission with zero amount', () => {
      const invalidData = { ...validData, amount: 0 };
      const result = reimbursementSubmitSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject submission with non-integer amount', () => {
      const invalidData = { ...validData, amount: 100.5 };
      const result = reimbursementSubmitSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject submission with invalid URI', () => {
      const invalidData = { ...validData, invoice_uri: 'not-a-uri' };
      const result = reimbursementSubmitSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject submission without invoice_hash', () => {
      const { invoice_hash, ...dataWithoutHash } = validData;
      const result = reimbursementSubmitSchema.validate(dataWithoutHash);
      expect(result.error).toBeDefined();
    });
  });

  describe('reimbursementApprovalSchema', () => {
    const validData = {
      id: 1,
      approver: '0x123',
    };

    it('should validate correct approval data', () => {
      const result = reimbursementApprovalSchema.validate(validData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validData);
    });

    it('should reject approval with negative id', () => {
      const invalidData = { ...validData, id: -1 };
      const result = reimbursementApprovalSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject approval with non-integer id', () => {
      const invalidData = { ...validData, id: 1.5 };
      const result = reimbursementApprovalSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject approval with invalid approver address', () => {
      const invalidData = { ...validData, approver: 'invalid' };
      const result = reimbursementApprovalSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should allow id of zero', () => {
      const dataWithZero = { ...validData, id: 0 };
      const result = reimbursementApprovalSchema.validate(dataWithZero);
      expect(result.error).toBeUndefined();
    });
  });

  describe('proposalCreateSchema', () => {
    const now = Math.floor(Date.now() / 1000);
    const validData = {
      creator: '0x123',
      title: 'Test Proposal',
      description: 'This is a test proposal description',
      start_ts: now,
      end_ts: now + 86400,
    };

    it('should validate correct proposal data', () => {
      const result = proposalCreateSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should reject proposal with short title', () => {
      const invalidData = { ...validData, title: 'Test' };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal with long title', () => {
      const invalidData = { ...validData, title: 'a'.repeat(201) };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal with short description', () => {
      const invalidData = { ...validData, description: 'Short' };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal with long description', () => {
      const invalidData = { ...validData, description: 'a'.repeat(5001) };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal where end_ts is before start_ts', () => {
      const invalidData = { ...validData, end_ts: now - 1 };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal where end_ts equals start_ts', () => {
      const invalidData = { ...validData, end_ts: now };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject proposal with invalid creator address', () => {
      const invalidData = { ...validData, creator: 'invalid' };
      const result = proposalCreateSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });
  });

  describe('voteSchema', () => {
    const validData = {
      voter: '0x123',
      vote: true,
    };

    it('should validate correct vote data with true', () => {
      const result = voteSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct vote data with false', () => {
      const dataWithFalse = { ...validData, vote: false };
      const result = voteSchema.validate(dataWithFalse);
      expect(result.error).toBeUndefined();
    });

    it('should reject vote without voter', () => {
      const { voter, ...dataWithoutVoter } = validData;
      const result = voteSchema.validate(dataWithoutVoter);
      expect(result.error).toBeDefined();
    });

    it('should reject vote with non-boolean vote', () => {
      const invalidData = { ...validData, vote: 'yes' };
      const result = voteSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject vote with invalid voter address', () => {
      const invalidData = { ...validData, voter: 'invalid' };
      const result = voteSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });
  });

  describe('electionVoteSchema', () => {
    const validData = {
      voter: '0x123',
      candidate: '0x456',
      role_name: 'president',
      election_id: 1,
    };

    it('should validate correct election vote data', () => {
      const result = electionVoteSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should reject without voter', () => {
      const { voter, ...dataWithoutVoter } = validData;
      const result = electionVoteSchema.validate(dataWithoutVoter);
      expect(result.error).toBeDefined();
    });

    it('should reject with invalid candidate address', () => {
      const invalidData = { ...validData, candidate: 'invalid' };
      const result = electionVoteSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject without role_name', () => {
      const { role_name, ...dataWithoutRole } = validData;
      const result = electionVoteSchema.validate(dataWithoutRole);
      expect(result.error).toBeDefined();
    });

    it('should reject with negative election_id', () => {
      const invalidData = { ...validData, election_id: -1 };
      const result = electionVoteSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should allow election_id of zero', () => {
      const dataWithZero = { ...validData, election_id: 0 };
      const result = electionVoteSchema.validate(dataWithZero);
      expect(result.error).toBeUndefined();
    });
  });

  describe('paginationSchema', () => {
    it('should apply default values when no data provided', () => {
      const result = paginationSchema.validate({});
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual({
        page: 1,
        limit: 20,
        sort: 'desc',
      });
    });

    it('should validate correct pagination data', () => {
      const validData = { page: 2, limit: 50, sort: 'asc' };
      const result = paginationSchema.validate(validData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validData);
    });

    it('should reject page less than 1', () => {
      const invalidData = { page: 0 };
      const result = paginationSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject limit less than 1', () => {
      const invalidData = { limit: 0 };
      const result = paginationSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject limit greater than 100', () => {
      const invalidData = { limit: 101 };
      const result = paginationSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid sort value', () => {
      const invalidData = { sort: 'invalid' };
      const result = paginationSchema.validate(invalidData);
      expect(result.error).toBeDefined();
    });

    it('should accept sort as asc', () => {
      const validData = { sort: 'asc' };
      const result = paginationSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });

    it('should accept sort as desc', () => {
      const validData = { sort: 'desc' };
      const result = paginationSchema.validate(validData);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateQuery middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        query: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('should call next() with valid query data', () => {
      mockReq.query = { page: '1', limit: '20' };
      const middleware = validateQuery(paginationSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.query.page).toBe(1);
      expect(mockReq.query.limit).toBe(20);
    });

    it('should return 400 error with invalid query data', () => {
      mockReq.query = { page: '-1' };
      const middleware = validateQuery(paginationSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should apply default values from schema', () => {
      mockReq.query = {};
      const middleware = validateQuery(paginationSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query).toEqual({
        page: 1,
        limit: 20,
        sort: 'desc',
      });
    });
  });

  describe('validateBody middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      mockNext = jest.fn();
    });

    it('should call next() with valid body data', () => {
      mockReq.body = {
        voter: '0x123',
        vote: true,
      };
      const middleware = validateBody(voteSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 error with invalid body data', () => {
      mockReq.body = {
        voter: 'invalid-address',
        vote: true,
      };
      const middleware = validateBody(voteSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return multiple validation errors', () => {
      mockReq.body = {
        voter: 'invalid',
        // missing vote
      };
      const middleware = validateBody(voteSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.arrayContaining([expect.any(String)]),
        })
      );
    });

    it('should transform validated data', () => {
      const now = Math.floor(Date.now() / 1000);
      mockReq.body = {
        creator: '0x123',
        title: 'Test Proposal',
        description: 'Test proposal description',
        start_ts: now,
        end_ts: now + 86400,
      };
      const middleware = validateBody(proposalCreateSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual(expect.objectContaining({
        creator: '0x123',
        title: 'Test Proposal',
        description: 'Test proposal description',
      }));
    });
  });
});
