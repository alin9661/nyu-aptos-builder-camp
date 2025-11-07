/**
 * Database helper utilities for testing
 * Provides functions to seed, clear, and manage test data
 */

import { Pool } from 'pg';

// Create test database pool
export const createTestPool = (): Pool => {
  return new Pool({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'nyu_aptos_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    max: 5,
  });
};

// Singleton test pool
let testPool: Pool | null = null;

export const getTestPool = (): Pool => {
  if (!testPool) {
    testPool = createTestPool();
  }
  return testPool;
};

export const closeTestPool = async (): Promise<void> => {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
};

/**
 * Clear all data from test database tables
 */
export const clearDatabase = async (): Promise<void> => {
  const pool = getTestPool();

  const tables = [
    'proposal_votes',
    'proposals',
    'election_votes',
    'election_candidates',
    'elections',
    'invoice_metadata',
    'reimbursement_approvals',
    'reimbursement_requests',
    'treasury_deposits',
    'users',
  ];

  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
};

/**
 * Seed test users
 */
export const seedUsers = async (users: Array<{
  address: string;
  role: string;
  display_name: string;
  email?: string;
}>): Promise<void> => {
  const pool = getTestPool();

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (address, role, display_name, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (address) DO UPDATE
       SET role = $2, display_name = $3, email = $4`,
      [user.address, user.role, user.display_name, user.email || null]
    );
  }
};

/**
 * Seed treasury deposits
 */
export const seedTreasuryDeposits = async (deposits: Array<{
  source: string;
  amount: string;
  total_balance: string;
  transaction_hash: string;
  version: number;
  block_height: number;
  timestamp: number;
}>): Promise<void> => {
  const pool = getTestPool();

  for (const deposit of deposits) {
    await pool.query(
      `INSERT INTO treasury_deposits
       (source, amount, total_balance, transaction_hash, version, block_height, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        deposit.source,
        deposit.amount,
        deposit.total_balance,
        deposit.transaction_hash,
        deposit.version,
        deposit.block_height,
        deposit.timestamp,
      ]
    );
  }
};

/**
 * Seed reimbursement requests
 */
export const seedReimbursementRequests = async (requests: Array<{
  id?: number;
  payer: string;
  payee: string;
  amount: string;
  description: string;
  paid_out: boolean;
  created_ts: number;
  transaction_hash: string;
  version: number;
}>): Promise<number[]> => {
  const pool = getTestPool();
  const ids: number[] = [];

  for (const request of requests) {
    const result = await pool.query(
      `INSERT INTO reimbursement_requests
       (payer, payee, amount, description, paid_out, created_ts, transaction_hash, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        request.payer,
        request.payee,
        request.amount,
        request.description,
        request.paid_out,
        request.created_ts,
        request.transaction_hash,
        request.version,
      ]
    );
    ids.push(result.rows[0].id);
  }

  return ids;
};

/**
 * Seed elections
 */
export const seedElections = async (elections: Array<{
  election_id: number;
  role_name: string;
  start_ts: number;
  end_ts: number;
  finalized: boolean;
  winner?: string;
}>): Promise<void> => {
  const pool = getTestPool();

  for (const election of elections) {
    await pool.query(
      `INSERT INTO elections
       (election_id, role_name, start_ts, end_ts, finalized, winner)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        election.election_id,
        election.role_name,
        election.start_ts,
        election.end_ts,
        election.finalized,
        election.winner || null,
      ]
    );
  }
};

/**
 * Seed election candidates
 */
export const seedElectionCandidates = async (candidates: Array<{
  election_id: number;
  role_name: string;
  candidate: string;
  timestamp: number;
}>): Promise<void> => {
  const pool = getTestPool();

  for (const candidate of candidates) {
    await pool.query(
      `INSERT INTO election_candidates
       (election_id, role_name, candidate, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [candidate.election_id, candidate.role_name, candidate.candidate, candidate.timestamp]
    );
  }
};

/**
 * Seed proposals
 */
export const seedProposals = async (proposals: Array<{
  proposal_id: number;
  creator: string;
  title: string;
  description: string;
  status: number;
  start_ts: number;
  end_ts: number;
  yay_votes?: string;
  nay_votes?: string;
}>): Promise<void> => {
  const pool = getTestPool();

  for (const proposal of proposals) {
    await pool.query(
      `INSERT INTO proposals
       (proposal_id, creator, title, description, status, start_ts, end_ts, yay_votes, nay_votes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        proposal.proposal_id,
        proposal.creator,
        proposal.title,
        proposal.description,
        proposal.status,
        proposal.start_ts,
        proposal.end_ts,
        proposal.yay_votes || '0',
        proposal.nay_votes || '0',
      ]
    );
  }
};

/**
 * Query helper for tests
 */
export const queryTest = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const pool = getTestPool();
  const result = await pool.query(text, params);
  return result.rows;
};

/**
 * Count rows in a table
 */
export const countRows = async (tableName: string): Promise<number> => {
  const pool = getTestPool();
  const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count);
};

/**
 * Check if table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  const pool = getTestPool();
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
};
