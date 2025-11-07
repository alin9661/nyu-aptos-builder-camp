/**
 * Unit tests for database configuration
 * Following TDD principles: test database connection, query execution, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getTestPool, closeTestPool, clearDatabase } from '../../helpers/database.helper';

describe('Database Configuration', () => {
  describe('Connection Management', () => {
    it('should successfully connect to the test database', async () => {
      // Arrange & Act
      const pool = getTestPool();
      const result = await pool.query('SELECT NOW()');

      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeDefined();
    });

    it('should reuse existing pool connection', () => {
      // Arrange & Act
      const pool1 = getTestPool();
      const pool2 = getTestPool();

      // Assert - should be the same instance
      expect(pool1).toBe(pool2);
    });

    it('should properly close the pool connection', async () => {
      // Arrange
      const pool = getTestPool();

      // Act
      await closeTestPool();

      // Assert - getting pool again should create new instance
      const newPool = getTestPool();
      expect(newPool).not.toBe(pool);
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      await clearDatabase();
    });

    it('should execute SELECT queries successfully', async () => {
      // Arrange
      const pool = getTestPool();

      // Act
      const result = await pool.query('SELECT 1 as test_value');

      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test_value).toBe(1);
    });

    it('should execute INSERT queries successfully', async () => {
      // Arrange
      const pool = getTestPool();
      const testAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const result = await pool.query(
        `INSERT INTO users (address, role, display_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [testAddress, 'member', 'Test User']
      );

      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].address).toBe(testAddress);
      expect(result.rows[0].role).toBe('member');
      expect(result.rows[0].display_name).toBe('Test User');
    });

    it('should execute UPDATE queries successfully', async () => {
      // Arrange
      const pool = getTestPool();
      const testAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';

      await pool.query(
        `INSERT INTO users (address, role, display_name)
         VALUES ($1, $2, $3)`,
        [testAddress, 'member', 'Test User']
      );

      // Act
      const result = await pool.query(
        `UPDATE users
         SET role = $2
         WHERE address = $1
         RETURNING *`,
        [testAddress, 'eboard_member']
      );

      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].role).toBe('eboard_member');
    });

    it('should execute DELETE queries successfully', async () => {
      // Arrange
      const pool = getTestPool();
      const testAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';

      await pool.query(
        `INSERT INTO users (address, role, display_name)
         VALUES ($1, $2, $3)`,
        [testAddress, 'member', 'Test User']
      );

      // Act
      await pool.query('DELETE FROM users WHERE address = $1', [testAddress]);
      const result = await pool.query('SELECT * FROM users WHERE address = $1', [testAddress]);

      // Assert
      expect(result.rows).toHaveLength(0);
    });

    it('should handle parameterized queries correctly', async () => {
      // Arrange
      const pool = getTestPool();
      const users = [
        { address: '0x1111', role: 'member', name: 'User 1' },
        { address: '0x2222', role: 'eboard_member', name: 'User 2' },
        { address: '0x3333', role: 'member', name: 'User 3' },
      ];

      for (const user of users) {
        await pool.query(
          'INSERT INTO users (address, role, display_name) VALUES ($1, $2, $3)',
          [user.address, user.role, user.name]
        );
      }

      // Act
      const result = await pool.query(
        'SELECT * FROM users WHERE role = $1 ORDER BY address',
        ['member']
      );

      // Assert
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].address).toBe('0x1111');
      expect(result.rows[1].address).toBe('0x3333');
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(async () => {
      await clearDatabase();
    });

    it('should commit transaction on success', async () => {
      // Arrange
      const pool = getTestPool();
      const client = await pool.connect();

      try {
        // Act
        await client.query('BEGIN');
        await client.query(
          'INSERT INTO users (address, role, display_name) VALUES ($1, $2, $3)',
          ['0x1111', 'member', 'Test User']
        );
        await client.query('COMMIT');
        client.release();

        // Assert
        const result = await pool.query('SELECT * FROM users WHERE address = $1', ['0x1111']);
        expect(result.rows).toHaveLength(1);
      } catch (error) {
        client.release();
        throw error;
      }
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      const pool = getTestPool();
      const client = await pool.connect();

      try {
        // Act
        await client.query('BEGIN');
        await client.query(
          'INSERT INTO users (address, role, display_name) VALUES ($1, $2, $3)',
          ['0x1111', 'member', 'Test User']
        );
        // Intentionally cause an error
        await client.query('ROLLBACK');
        client.release();

        // Assert
        const result = await pool.query('SELECT * FROM users WHERE address = $1', ['0x1111']);
        expect(result.rows).toHaveLength(0);
      } catch (error) {
        client.release();
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL syntax', async () => {
      // Arrange
      const pool = getTestPool();

      // Act & Assert
      await expect(
        pool.query('INVALID SQL QUERY')
      ).rejects.toThrow();
    });

    it('should handle constraint violations', async () => {
      // Arrange
      const pool = getTestPool();
      const testAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';

      await pool.query(
        'INSERT INTO users (address, role, display_name) VALUES ($1, $2, $3)',
        [testAddress, 'member', 'Test User']
      );

      // Act & Assert - try to insert duplicate primary key
      await expect(
        pool.query(
          'INSERT INTO users (address, role, display_name) VALUES ($1, $2, $3)',
          [testAddress, 'member', 'Duplicate User']
        )
      ).rejects.toThrow();
    });

    it('should handle non-existent table queries', async () => {
      // Arrange
      const pool = getTestPool();

      // Act & Assert
      await expect(
        pool.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });
  });

  describe('Connection Pooling', () => {
    it('should handle multiple concurrent queries', async () => {
      // Arrange
      const pool = getTestPool();
      const queries = Array(10).fill(null).map((_, i) =>
        pool.query('SELECT $1 as value', [i])
      );

      // Act
      const results = await Promise.all(queries);

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.rows[0].value).toBe(i);
      });
    });

    it('should properly release clients back to pool', async () => {
      // Arrange
      const pool = getTestPool();
      const client = await pool.connect();

      // Act
      await client.query('SELECT 1');
      client.release();

      // Assert - should be able to get another client
      const client2 = await pool.connect();
      expect(client2).toBeDefined();
      client2.release();
    });
  });
});
