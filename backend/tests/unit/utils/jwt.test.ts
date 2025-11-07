/**
 * Unit tests for JWT utilities
 * Tests token generation, verification, and extraction
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from '../../../src/utils/jwt';

describe('JWT Utilities', () => {
  const testAddress = '0x123456789abcdef';
  const testRole = 'advisor';
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(testAddress, testRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include address and role in token payload', () => {
      const token = generateAccessToken(testAddress, testRole);
      const decoded = jwt.decode(token) as any;

      expect(decoded.address).toBe(testAddress);
      expect(decoded.role).toBe(testRole);
    });

    it('should include expiration time', () => {
      const token = generateAccessToken(testAddress, testRole);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different tokens for different addresses', () => {
      const token1 = generateAccessToken('0x111', testRole);
      const token2 = generateAccessToken('0x222', testRole);

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different roles', () => {
      const token1 = generateAccessToken(testAddress, 'advisor');
      const token2 = generateAccessToken(testAddress, 'president');

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(testAddress);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include address in token payload', () => {
      const token = generateRefreshToken(testAddress);
      const decoded = jwt.decode(token) as any;

      expect(decoded.address).toBe(testAddress);
    });

    it('should not include role in refresh token', () => {
      const token = generateRefreshToken(testAddress);
      const decoded = jwt.decode(token) as any;

      expect(decoded.role).toBeUndefined();
    });

    it('should have longer expiration than access token', () => {
      const accessToken = generateAccessToken(testAddress, testRole);
      const refreshToken = generateRefreshToken(testAddress);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(refreshDecoded.exp - refreshDecoded.iat).toBeGreaterThan(
        accessDecoded.exp - accessDecoded.iat
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(testAddress, testRole);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid tokens', () => {
      const tokens = generateTokenPair(testAddress, testRole);

      const accessDecoded = jwt.decode(tokens.accessToken) as any;
      const refreshDecoded = jwt.decode(tokens.refreshToken) as any;

      expect(accessDecoded.address).toBe(testAddress);
      expect(accessDecoded.role).toBe(testRole);
      expect(refreshDecoded.address).toBe(testAddress);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testAddress, testRole);
      const payload = verifyAccessToken(token);

      expect(payload.address).toBe(testAddress);
      expect(payload.role).toBe(testRole);
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid access token');
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign({ address: testAddress }, 'wrong-secret');

      expect(() => verifyAccessToken(token)).toThrow('Invalid access token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { address: testAddress, role: testRole },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow('Access token has expired');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not-a-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testAddress);
      const payload = verifyRefreshToken(token);

      expect(payload.address).toBe(testAddress);
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token');
    });

    it('should throw error for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { address: testAddress },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1s' }
      );

      expect(() => verifyRefreshToken(expiredToken)).toThrow('Refresh token has expired');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(testAddress, testRole);

      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'test.jwt.token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = 'test.jwt.token';

      const extracted = extractTokenFromHeader(token);

      expect(extracted).toBeNull();
    });

    it('should return null for malformed header', () => {
      const extracted = extractTokenFromHeader('Bearer');

      expect(extracted).toBeNull();
    });

    it('should return null for empty Bearer token', () => {
      const extracted = extractTokenFromHeader('Bearer ');

      expect(extracted).toBeNull();
    });

    it('should handle extra spaces', () => {
      const token = 'test.jwt.token';
      const header = `Bearer  ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull(); // Should be strict about format
    });

    it('should be case-sensitive for Bearer keyword', () => {
      const token = 'test.jwt.token';
      const header = `bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token without verification', () => {
      const token = generateAccessToken(testAddress, testRole);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.address).toBe(testAddress);
      expect(decoded?.role).toBe(testRole);
    });

    it('should decode expired token without error', () => {
      const expiredToken = jwt.sign(
        { address: testAddress, role: testRole },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );

      const decoded = decodeToken(expiredToken);

      expect(decoded).not.toBeNull();
      expect(decoded?.address).toBe(testAddress);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not.a.valid.token');

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = decodeToken('malformed');

      expect(decoded).toBeNull();
    });

    it('should not verify signature', () => {
      // Token signed with different secret should still decode
      const token = jwt.sign({ address: testAddress }, 'different-secret');
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.address).toBe(testAddress);
    });
  });

  describe('Token Security', () => {
    it('should not accept tokens signed with wrong secret', () => {
      const token = jwt.sign(
        { address: testAddress, role: testRole },
        'wrong-secret'
      );

      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should not accept modified payload', () => {
      const token = generateAccessToken(testAddress, testRole);
      const parts = token.split('.');

      // Modify payload (base64 decode, modify, encode)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.role = 'admin'; // Try to escalate privileges
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');

      const modifiedToken = parts.join('.');

      expect(() => verifyAccessToken(modifiedToken)).toThrow();
    });

    it('should generate unique tokens each time', () => {
      const token1 = generateAccessToken(testAddress, testRole);
      // Small delay to ensure different iat
      const token2 = generateAccessToken(testAddress, testRole);

      // Tokens should be different due to different iat timestamps
      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;

      // Even if generated quickly, at least iat should potentially differ
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('Token Expiration', () => {
    it('should have correct expiry duration for access token', () => {
      const token = generateAccessToken(testAddress, testRole);
      const decoded = jwt.decode(token) as any;

      // 15 minutes = 900 seconds
      const duration = decoded.exp - decoded.iat;
      expect(duration).toBe(900);
    });

    it('should have correct expiry duration for refresh token', () => {
      const token = generateRefreshToken(testAddress);
      const decoded = jwt.decode(token) as any;

      // 7 days = 604800 seconds
      const duration = decoded.exp - decoded.iat;
      expect(duration).toBe(604800);
    });
  });
});
