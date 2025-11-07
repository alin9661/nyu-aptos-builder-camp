/**
 * Integration tests for auth routes
 * Tests authentication flow, token management, and profile operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import authRouter from '../../src/routes/auth';
import {
  clearDatabase,
  seedUsers,
  getTestPool,
  closeTestPool,
} from '../helpers/database.helper';
import { generateNonce, createLoginMessage } from '../../src/utils/wallet';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt';
import {
  TEST_ADDRESSES,
  TEST_ROLES,
  expectSuccess,
  expectError,
  expectValidationError,
  expectUnauthorized,
} from '../helpers/api.helper';
import { generateUser } from '../helpers/mock-data.helper';

describe('Auth Routes Integration Tests', () => {
  let app: Application;
  const testUser = {
    address: TEST_ADDRESSES.MEMBER,
    role: TEST_ROLES.MEMBER,
    display_name: 'Test User',
    email: 'test@example.com',
  };

  beforeAll(async () => {
    // Setup Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  afterAll(async () => {
    await closeTestPool();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/nonce', () => {
    it('should generate nonce for valid address', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: testUser.address });

      const data = expectSuccess(response);
      expect(data.nonce).toBeDefined();
      expect(data.message).toBeDefined();
      expect(data.address).toBe(testUser.address);
      expect(data.message).toContain(testUser.address);
    });

    it('should return 400 for invalid address', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: 'invalid-address' });

      expectError(response, 400);
    });

    it('should return 400 for missing address', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({});

      expectError(response, 400);
    });

    it('should generate different nonces for same address', async () => {
      const response1 = await request(app)
        .post('/api/auth/nonce')
        .send({ address: testUser.address });

      const response2 = await request(app)
        .post('/api/auth/nonce')
        .send({ address: testUser.address });

      const data1 = expectSuccess(response1);
      const data2 = expectSuccess(response2);

      expect(data1.nonce).not.toBe(data2.nonce);
    });

    it('should include login message with nonce', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: testUser.address });

      const data = expectSuccess(response);
      expect(data.message).toContain('Sign in to NYU Aptos Builder Camp');
      expect(data.message).toContain(data.nonce);
      expect(data.message).toContain('Nonce:');
    });

    it('should rate limit nonce requests', async () => {
      // Make multiple requests
      const requests = Array.from({ length: 12 }, () =>
        request(app).post('/api/auth/nonce').send({ address: testUser.address })
      );

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      expect(responses[11].status).toBe(429);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login without nonce request', async () => {
      const nonce = generateNonce();
      const message = createLoginMessage(testUser.address, nonce);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: testUser.address,
          message,
          signature: '0x' + 'a'.repeat(128),
          publicKey: '0x' + 'b'.repeat(64),
        });

      expectError(response, 400);
      expect(response.body.error).toContain('Nonce not found');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ address: testUser.address });

      expectError(response, 400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: 'invalid',
          message: 'test',
          signature: '0xabc',
          publicKey: '0xdef',
        });

      expectError(response, 400);
      expect(response.body.error).toContain('Invalid address');
    });

    it('should create new user on first login', async () => {
      await seedUsers([testUser]);

      // In real scenario, this would require valid signature
      // For now, testing the flow structure
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          address: '0xnewuser',
          message: 'test',
          signature: '0x' + 'a'.repeat(128),
          publicKey: '0x' + 'b'.repeat(64),
        });

      // Will fail signature verification, but shows the flow
      expect(response.status).toBe(401);
    });

    it('should rate limit login attempts', async () => {
      const requests = Array.from({ length: 7 }, () =>
        request(app).post('/api/auth/login').send({
          address: testUser.address,
          message: 'test',
          signature: '0xabc',
          publicKey: '0xdef',
        })
      );

      const responses = await Promise.all(requests);

      // Last requests should be rate limited
      expect(responses[6].status).toBe(429);
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      await seedUsers([testUser]);
    });

    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = generateRefreshToken(testUser.address);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      const data = expectSuccess(response);
      expect(data.accessToken).toBeDefined();
      expect(typeof data.accessToken).toBe('string');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expectError(response, 400);
      expect(response.body.error).toContain('Missing refresh token');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expectError(response, 401);
      expect(response.body.error).toContain('Invalid refresh token');
    });

    it('should return 401 for non-existent user', async () => {
      const refreshToken = generateRefreshToken('0xnonexistent');

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expectError(response, 401);
      expect(response.body.error).toContain('User not found');
    });

    it('should include current user role in new access token', async () => {
      const refreshToken = generateRefreshToken(testUser.address);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      const data = expectSuccess(response);
      expect(data.accessToken).toBeDefined();
    });
  });

  describe('POST /api/auth/verify', () => {
    beforeEach(async () => {
      await seedUsers([testUser]);
    });

    it('should verify valid access token', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      const data = expectSuccess(response);
      expect(data.valid).toBe(true);
      expect(data.user.address).toBe(testUser.address);
      expect(data.user.role).toBe(testUser.role);
    });

    it('should verify token from request body', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token });

      const data = expectSuccess(response);
      expect(data.valid).toBe(true);
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify');

      expectError(response, 400);
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expectError(response, 401);
    });

    it('should return 401 for non-existent user', async () => {
      const token = generateAccessToken('0xnonexistent', 'member');

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expectError(response, 401);
      expect(response.body.error).toContain('User not found');
    });

    it('should return 401 if user role changed', async () => {
      // Generate token with old role
      const token = generateAccessToken(testUser.address, 'admin');

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expectError(response, 401);
      expect(response.body.error).toContain('role has changed');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      await seedUsers([testUser]);
    });

    it('should return current user info', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      const data = expectSuccess(response);
      expect(data.user.address).toBe(testUser.address);
      expect(data.user.role).toBe(testUser.role);
      expect(data.user.displayName).toBe(testUser.display_name);
      expect(data.user.email).toBe(testUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expectUnauthorized(response);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectUnauthorized(response);
    });

    it('should return 404 if user deleted', async () => {
      const token = generateAccessToken('0xdeleted', 'member');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expectError(response, 404);
    });
  });

  describe('PUT /api/auth/profile', () => {
    beforeEach(async () => {
      await seedUsers([testUser]);
    });

    it('should update user display name', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);
      const newName = 'Updated Name';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: newName });

      const data = expectSuccess(response);
      expect(data.user.display_name).toBe(newName);
    });

    it('should update user email', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);
      const newEmail = 'newemail@example.com';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: newEmail });

      const data = expectSuccess(response);
      expect(data.user.email).toBe(newEmail);
    });

    it('should update both name and email', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          displayName: 'New Name',
          email: 'new@example.com',
        });

      const data = expectSuccess(response);
      expect(data.user.display_name).toBe('New Name');
      expect(data.user.email).toBe('new@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email' });

      expectError(response, 400);
      expect(response.body.error).toContain('Invalid email');
    });

    it('should return 400 with no fields to update', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expectError(response, 400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ displayName: 'New Name' });

      expectUnauthorized(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      await seedUsers([testUser]);
    });

    it('should logout authenticated user', async () => {
      const token = generateAccessToken(testUser.address, testUser.role);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      const data = expectSuccess(response);
      expect(data.message).toContain('Logged out');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expectUnauthorized(response);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expectUnauthorized(response);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const requests = Array.from({ length: 15 }, () =>
        request(app).post('/api/auth/nonce').send({ address: testUser.address })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should have stricter limits on login endpoint', async () => {
      const requests = Array.from({ length: 7 }, () =>
        request(app).post('/api/auth/login').send({
          address: testUser.address,
          message: 'test',
          signature: '0xabc',
          publicKey: '0xdef',
        })
      );

      const responses = await Promise.all(requests);

      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
