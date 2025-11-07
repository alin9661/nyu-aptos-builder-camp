/**
 * Global teardown - runs once after all test suites complete
 * Used for cleanup operations
 */

import { Pool } from 'pg';

export default async function globalTeardown() {
  console.log('\n=== Cleaning up test environment ===\n');

  try {
    // Optional: Drop test database after tests
    // Uncomment if you want to drop the database after each test run
    // const shouldDropDatabase = process.env.DROP_TEST_DB === 'true';

    // if (shouldDropDatabase) {
    //   const setupPool = new Pool({
    //     host: process.env.TEST_DB_HOST || 'localhost',
    //     port: parseInt(process.env.TEST_DB_PORT || '5432'),
    //     database: 'postgres',
    //     user: process.env.TEST_DB_USER || 'postgres',
    //     password: process.env.TEST_DB_PASSWORD || 'postgres',
    //   });

    //   const dbName = process.env.TEST_DB_NAME || 'nyu_aptos_test';
    //   console.log(`Dropping test database: ${dbName}`);
    //   await setupPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    //   await setupPool.end();
    //   console.log('Test database dropped successfully');
    // }

    console.log('Test environment cleanup complete');
  } catch (error) {
    console.error('Failed to clean up test environment:', error);
  }

  console.log('\n=== Test environment cleanup complete ===\n');
}
