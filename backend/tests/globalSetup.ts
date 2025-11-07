/**
 * Global setup - runs once before all test suites
 * Used for one-time setup like database initialization
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('\n=== Setting up test environment ===\n');

  // Create test database if it doesn't exist
  const setupPool = new Pool({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: 'postgres', // Connect to default database first
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  });

  try {
    const dbName = process.env.TEST_DB_NAME || 'nyu_aptos_test';

    // Check if test database exists
    const result = await setupPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create test database
      console.log(`Creating test database: ${dbName}`);
      await setupPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Test database created successfully`);
    } else {
      console.log(`Test database ${dbName} already exists`);
    }

    // Connect to test database and create schema
    const testPool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: dbName,
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
    });

    // Create test tables (simplified schema for testing)
    console.log('Creating test database schema...');

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        address VARCHAR(66) PRIMARY KEY,
        role VARCHAR(50),
        display_name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS treasury_deposits (
        id SERIAL PRIMARY KEY,
        source VARCHAR(50),
        amount NUMERIC,
        total_balance NUMERIC,
        transaction_hash VARCHAR(66),
        version BIGINT,
        block_height BIGINT,
        timestamp BIGINT
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS reimbursement_requests (
        id SERIAL PRIMARY KEY,
        payer VARCHAR(66),
        payee VARCHAR(66),
        amount NUMERIC,
        description TEXT,
        paid_out BOOLEAN DEFAULT false,
        created_ts BIGINT,
        transaction_hash VARCHAR(66),
        version BIGINT
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS reimbursement_approvals (
        id SERIAL PRIMARY KEY,
        request_id INTEGER,
        approver VARCHAR(66),
        timestamp BIGINT,
        transaction_hash VARCHAR(66),
        version BIGINT
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS invoice_metadata (
        id SERIAL PRIMARY KEY,
        request_id INTEGER UNIQUE,
        ipfs_hash VARCHAR(100),
        file_name VARCHAR(255),
        file_size BIGINT,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP,
        verified_on_chain BOOLEAN DEFAULT false
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS elections (
        election_id INTEGER,
        role_name VARCHAR(50),
        start_ts BIGINT,
        end_ts BIGINT,
        finalized BOOLEAN DEFAULT false,
        winner VARCHAR(66),
        PRIMARY KEY (election_id, role_name)
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS election_candidates (
        election_id INTEGER,
        role_name VARCHAR(50),
        candidate VARCHAR(66),
        timestamp BIGINT,
        PRIMARY KEY (election_id, role_name, candidate)
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS election_votes (
        election_id INTEGER,
        role_name VARCHAR(50),
        voter VARCHAR(66),
        candidate VARCHAR(66),
        weight NUMERIC,
        timestamp BIGINT,
        PRIMARY KEY (election_id, role_name, voter)
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        proposal_id INTEGER PRIMARY KEY,
        creator VARCHAR(66),
        title TEXT,
        description TEXT,
        status INTEGER,
        start_ts BIGINT,
        end_ts BIGINT,
        yay_votes NUMERIC DEFAULT 0,
        nay_votes NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await testPool.query(`
      CREATE TABLE IF NOT EXISTS proposal_votes (
        proposal_id INTEGER,
        voter VARCHAR(66),
        vote BOOLEAN,
        weight NUMERIC,
        timestamp BIGINT,
        PRIMARY KEY (proposal_id, voter)
      );
    `);

    console.log('Test database schema created successfully');

    await testPool.end();
  } catch (error) {
    console.error('Failed to set up test database:', error);
    throw error;
  } finally {
    await setupPool.end();
  }

  console.log('\n=== Test environment setup complete ===\n');
}
