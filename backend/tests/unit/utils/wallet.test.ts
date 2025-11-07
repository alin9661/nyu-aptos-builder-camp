/**
 * Unit tests for wallet utilities
 * Tests signature verification, message creation, and validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  verifyWalletSignature,
  deriveAddressFromPublicKey,
  createLoginMessage,
  parseLoginMessage,
  validateLoginMessage,
  generateNonce,
  isValidAptosAddress,
  SignatureVerificationRequest,
} from '../../../src/utils/wallet';

describe('Wallet Utilities', () => {
  describe('isValidAptosAddress', () => {
    it('should validate correct Aptos address', () => {
      const validAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(isValidAptosAddress(validAddress)).toBe(true);
    });

    it('should validate short address', () => {
      expect(isValidAptosAddress('0x1')).toBe(true);
    });

    it('should reject address without 0x prefix', () => {
      expect(isValidAptosAddress('1234567890abcdef')).toBe(false);
    });

    it('should reject invalid hex characters', () => {
      expect(isValidAptosAddress('0xGHIJKL')).toBe(false);
    });

    it('should reject too long address', () => {
      const tooLong = '0x' + '1'.repeat(65);
      expect(isValidAptosAddress(tooLong)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidAptosAddress('')).toBe(false);
    });

    it('should accept mixed case', () => {
      expect(isValidAptosAddress('0x1234AbCd')).toBe(true);
    });
  });

  describe('generateNonce', () => {
    it('should generate a nonce', () => {
      const nonce = generateNonce();

      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate different nonces each time', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate hex string', () => {
      const nonce = generateNonce();
      expect(/^[0-9a-f]+$/i.test(nonce)).toBe(true);
    });

    it('should generate consistent length', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1.length).toBe(nonce2.length);
    });
  });

  describe('createLoginMessage', () => {
    const testAddress = '0x123456789abcdef';
    const testNonce = 'abc123';

    it('should create a login message with required fields', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain(testAddress);
      expect(message).toContain(testNonce);
      expect(message).toContain('Sign in to NYU Aptos Builder Camp');
    });

    it('should include domain in message', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('wants you to sign in');
    });

    it('should include URI field', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('URI:');
    });

    it('should include version', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('Version: 1');
    });

    it('should include chain ID', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('Chain ID:');
    });

    it('should include issued at timestamp', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('Issued At:');
      expect(message).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include expiration time', () => {
      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('Expiration Time:');
    });

    it('should use environment variables for domain', () => {
      const originalDomain = process.env.DOMAIN;
      process.env.DOMAIN = 'test.example.com';

      const message = createLoginMessage(testAddress, testNonce);

      expect(message).toContain('test.example.com');

      process.env.DOMAIN = originalDomain;
    });
  });

  describe('parseLoginMessage', () => {
    const testAddress = '0x123456789abcdef';
    const testNonce = 'abc123';

    it('should parse valid login message', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.address).toBe(testAddress);
      expect(parsed.nonce).toBe(testNonce);
      expect(parsed.statement).toBe('Sign in to NYU Aptos Builder Camp');
    });

    it('should extract domain', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.domain).toBeDefined();
      expect(typeof parsed.domain).toBe('string');
    });

    it('should extract URI', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.uri).toBeDefined();
      expect(parsed.uri).toContain('http');
    });

    it('should extract version', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.version).toBe('1');
    });

    it('should extract chain ID', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.chainId).toBeDefined();
    });

    it('should extract timestamps', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const parsed = parseLoginMessage(message);

      expect(parsed.issuedAt).toBeDefined();
      expect(parsed.expirationTime).toBeDefined();
    });

    it('should handle malformed message gracefully', () => {
      const malformedMessage = 'This is not a valid message';
      const parsed = parseLoginMessage(malformedMessage);

      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });

  describe('validateLoginMessage', () => {
    const testAddress = '0x123456789abcdef';
    const testNonce = 'abc123';

    it('should validate correct message', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const isValid = validateLoginMessage(message, testNonce);

      expect(isValid).toBe(true);
    });

    it('should reject message with wrong nonce', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const isValid = validateLoginMessage(message, 'wrong-nonce');

      expect(isValid).toBe(false);
    });

    it('should reject message without required fields', () => {
      const incompleteMessage = 'Incomplete message';
      const isValid = validateLoginMessage(incompleteMessage);

      expect(isValid).toBe(false);
    });

    it('should validate without nonce check if not provided', () => {
      const message = createLoginMessage(testAddress, testNonce);
      const isValid = validateLoginMessage(message);

      expect(isValid).toBe(true);
    });

    it('should reject message with future issued time', () => {
      const futureDate = new Date(Date.now() + 10000).toISOString();
      const message = `example.com wants you to sign in with your Aptos account:
${testAddress}

Sign in to NYU Aptos Builder Camp

URI: https://example.com
Version: 1
Chain ID: testnet
Nonce: ${testNonce}
Issued At: ${futureDate}
Expiration Time: ${futureDate}`;

      const isValid = validateLoginMessage(message, testNonce);

      expect(isValid).toBe(false);
    });
  });

  describe('verifyWalletSignature', () => {
    it('should return false for missing required fields', async () => {
      const request: SignatureVerificationRequest = {
        address: '0x123',
        message: '',
        signature: '0xabc',
        publicKey: '0xdef',
      };

      const isValid = await verifyWalletSignature(request);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid address format', async () => {
      const request: SignatureVerificationRequest = {
        address: 'invalid',
        message: 'test message',
        signature: '0x' + 'a'.repeat(128),
        publicKey: '0x' + 'b'.repeat(64),
      };

      const isValid = await verifyWalletSignature(request);

      expect(isValid).toBe(false);
    });

    it('should handle signature without 0x prefix', async () => {
      const request: SignatureVerificationRequest = {
        address: '0x123',
        message: 'test message',
        signature: 'a'.repeat(128),
        publicKey: 'b'.repeat(64),
      };

      // Will fail verification but should handle format
      const isValid = await verifyWalletSignature(request);

      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for invalid signature', async () => {
      const request: SignatureVerificationRequest = {
        address: '0x123',
        message: 'test message',
        signature: '0x' + 'a'.repeat(128),
        publicKey: '0x' + 'b'.repeat(64),
      };

      const isValid = await verifyWalletSignature(request);

      expect(isValid).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const request: SignatureVerificationRequest = {
        address: '0x123',
        message: 'test',
        signature: 'invalid-hex',
        publicKey: 'invalid-hex',
      };

      const isValid = await verifyWalletSignature(request);

      expect(isValid).toBe(false);
    });
  });

  describe('deriveAddressFromPublicKey', () => {
    it('should derive address from public key', async () => {
      const publicKey = '0'.repeat(64);
      const address = await deriveAddressFromPublicKey(publicKey);

      expect(address).toBeDefined();
      expect(address.startsWith('0x')).toBe(true);
      expect(address.length).toBeGreaterThan(2);
    });

    it('should derive same address for same public key', async () => {
      const publicKey = '1'.repeat(64);
      const address1 = await deriveAddressFromPublicKey(publicKey);
      const address2 = await deriveAddressFromPublicKey(publicKey);

      expect(address1).toBe(address2);
    });

    it('should derive different addresses for different keys', async () => {
      const publicKey1 = '0'.repeat(64);
      const publicKey2 = '1'.repeat(64);

      const address1 = await deriveAddressFromPublicKey(publicKey1);
      const address2 = await deriveAddressFromPublicKey(publicKey2);

      expect(address1).not.toBe(address2);
    });

    it('should handle public key without 0x prefix', async () => {
      const publicKey = '0'.repeat(64);
      const address = await deriveAddressFromPublicKey(publicKey);

      expect(address).toBeDefined();
      expect(isValidAptosAddress(address)).toBe(true);
    });

    it('should return valid Aptos address format', async () => {
      const publicKey = 'a'.repeat(64);
      const address = await deriveAddressFromPublicKey(publicKey);

      expect(isValidAptosAddress(address)).toBe(true);
    });
  });

  describe('Integration: Full auth flow', () => {
    it('should complete full message creation and validation', () => {
      const address = '0x123456789abcdef';
      const nonce = generateNonce();

      // Create message
      const message = createLoginMessage(address, nonce);
      expect(message).toBeDefined();

      // Parse message
      const parsed = parseLoginMessage(message);
      expect(parsed.address).toBe(address);
      expect(parsed.nonce).toBe(nonce);

      // Validate message
      const isValid = validateLoginMessage(message, nonce);
      expect(isValid).toBe(true);
    });

    it('should reject tampered message', () => {
      const address = '0x123456789abcdef';
      const nonce = generateNonce();

      const message = createLoginMessage(address, nonce);
      const tamperedMessage = message.replace(address, '0xDIFFERENT');

      const isValid = validateLoginMessage(tamperedMessage, nonce);
      expect(isValid).toBe(false);
    });

    it('should handle expired message', () => {
      const address = '0x123456789abcdef';
      const nonce = 'abc123';

      // Create message with past expiration
      const pastDate = new Date(Date.now() - 10000).toISOString();
      const expiredMessage = `example.com wants you to sign in with your Aptos account:
${address}

Sign in to NYU Aptos Builder Camp

URI: https://example.com
Version: 1
Chain ID: testnet
Nonce: ${nonce}
Issued At: ${new Date(Date.now() - 20000).toISOString()}
Expiration Time: ${pastDate}`;

      const isValid = validateLoginMessage(expiredMessage, nonce);
      expect(isValid).toBe(false);
    });
  });
});
