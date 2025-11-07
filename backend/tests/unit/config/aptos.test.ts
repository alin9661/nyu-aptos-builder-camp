/**
 * Unit tests for Aptos configuration
 * Testing helper functions and configurations
 */

import { describe, it, expect } from '@jest/globals';

// Import the actual implementation (not mocked for unit testing helpers)
import {
  formatCoinAmount,
  parseCoinAmount,
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_NAMES,
  VOTING_WEIGHTS,
} from '../../../src/config/aptos';

describe('Aptos Configuration', () => {
  describe('formatCoinAmount', () => {
    it('should format integer amounts correctly', () => {
      // Arrange
      const amount = BigInt(100000000); // 1 APT with 8 decimals

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('1');
    });

    it('should format decimal amounts correctly', () => {
      // Arrange
      const amount = BigInt(123456789); // 1.23456789 APT

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('1.23456789');
    });

    it('should format amounts with trailing zeros correctly', () => {
      // Arrange
      const amount = BigInt(150000000); // 1.5 APT

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('1.5');
    });

    it('should format zero amount correctly', () => {
      // Arrange
      const amount = BigInt(0);

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('0');
    });

    it('should format small amounts correctly', () => {
      // Arrange
      const amount = BigInt(1); // 0.00000001 APT

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('0.00000001');
    });

    it('should handle custom decimal places', () => {
      // Arrange
      const amount = BigInt(1000000); // 1 token with 6 decimals

      // Act
      const formatted = formatCoinAmount(amount, 6);

      // Assert
      expect(formatted).toBe('1');
    });

    it('should handle large amounts', () => {
      // Arrange
      const amount = BigInt(999999999900000000); // 9,999,999,999 APT

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('9999999999');
    });

    it('should accept number type', () => {
      // Arrange
      const amount = 100000000; // 1 APT

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('1');
    });
  });

  describe('parseCoinAmount', () => {
    it('should parse integer amounts correctly', () => {
      // Arrange
      const amount = '1';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(100000000));
    });

    it('should parse decimal amounts correctly', () => {
      // Arrange
      const amount = '1.5';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(150000000));
    });

    it('should parse amounts with full precision', () => {
      // Arrange
      const amount = '1.23456789';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(123456789));
    });

    it('should parse zero correctly', () => {
      // Arrange
      const amount = '0';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(0));
    });

    it('should parse small amounts correctly', () => {
      // Arrange
      const amount = '0.00000001';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(1));
    });

    it('should handle custom decimal places', () => {
      // Arrange
      const amount = '1.5';

      // Act
      const parsed = parseCoinAmount(amount, 6);

      // Assert
      expect(parsed).toBe(BigInt(1500000));
    });

    it('should truncate excess decimal places', () => {
      // Arrange
      const amount = '1.123456789999'; // More than 8 decimals

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(123456789));
    });

    it('should handle missing decimal places', () => {
      // Arrange
      const amount = '1.5'; // Only 1 decimal place

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(150000000));
    });

    it('should handle large amounts', () => {
      // Arrange
      const amount = '9999999999.99999999';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(999999999999999999));
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain precision through format and parse cycle', () => {
      // Arrange
      const original = BigInt(123456789);

      // Act
      const formatted = formatCoinAmount(original);
      const parsed = parseCoinAmount(formatted);

      // Assert
      expect(parsed).toBe(original);
    });

    it('should maintain precision for multiple round trips', () => {
      // Arrange
      let amount = BigInt(987654321);

      // Act & Assert
      for (let i = 0; i < 10; i++) {
        const formatted = formatCoinAmount(amount);
        amount = parseCoinAmount(formatted);
      }

      expect(amount).toBe(BigInt(987654321));
    });
  });

  describe('Proposal Status Constants', () => {
    it('should have correct proposal status values', () => {
      // Assert
      expect(PROPOSAL_STATUS.DRAFT).toBe(0);
      expect(PROPOSAL_STATUS.ACTIVE).toBe(1);
      expect(PROPOSAL_STATUS.PASSED).toBe(2);
      expect(PROPOSAL_STATUS.REJECTED).toBe(3);
      expect(PROPOSAL_STATUS.EXECUTED).toBe(4);
    });

    it('should have matching status names', () => {
      // Assert
      expect(PROPOSAL_STATUS_NAMES[PROPOSAL_STATUS.DRAFT]).toBe('Draft');
      expect(PROPOSAL_STATUS_NAMES[PROPOSAL_STATUS.ACTIVE]).toBe('Active');
      expect(PROPOSAL_STATUS_NAMES[PROPOSAL_STATUS.PASSED]).toBe('Passed');
      expect(PROPOSAL_STATUS_NAMES[PROPOSAL_STATUS.REJECTED]).toBe('Rejected');
      expect(PROPOSAL_STATUS_NAMES[PROPOSAL_STATUS.EXECUTED]).toBe('Executed');
    });

    it('should have all status values mapped to names', () => {
      // Arrange
      const statusValues = Object.values(PROPOSAL_STATUS);

      // Act & Assert
      statusValues.forEach(status => {
        expect(PROPOSAL_STATUS_NAMES[status]).toBeDefined();
        expect(typeof PROPOSAL_STATUS_NAMES[status]).toBe('string');
      });
    });
  });

  describe('Voting Weights Constants', () => {
    it('should have correct voting weight values', () => {
      // Assert
      expect(VOTING_WEIGHTS.SCALE).toBe(2);
      expect(VOTING_WEIGHTS.EBOARD).toBe(2);
      expect(VOTING_WEIGHTS.ADVISOR).toBe(3);
    });

    it('should have advisor weight greater than eboard', () => {
      // Assert
      expect(VOTING_WEIGHTS.ADVISOR).toBeGreaterThan(VOTING_WEIGHTS.EBOARD);
    });

    it('should have all weights as positive numbers', () => {
      // Assert
      expect(VOTING_WEIGHTS.SCALE).toBeGreaterThan(0);
      expect(VOTING_WEIGHTS.EBOARD).toBeGreaterThan(0);
      expect(VOTING_WEIGHTS.ADVISOR).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts in formatCoinAmount', () => {
      // Arrange
      const amount = BigInt('999999999999999999'); // Near max safe integer

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('9999999999.99999999');
    });

    it('should handle very small amounts in formatCoinAmount', () => {
      // Arrange
      const amount = BigInt(1);

      // Act
      const formatted = formatCoinAmount(amount);

      // Assert
      expect(formatted).toBe('0.00000001');
    });

    it('should handle string with no decimal in parseCoinAmount', () => {
      // Arrange
      const amount = '100';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(10000000000));
    });

    it('should handle string with only decimal point in parseCoinAmount', () => {
      // Arrange
      const amount = '1.';

      // Act
      const parsed = parseCoinAmount(amount);

      // Assert
      expect(parsed).toBe(BigInt(100000000));
    });
  });
});
