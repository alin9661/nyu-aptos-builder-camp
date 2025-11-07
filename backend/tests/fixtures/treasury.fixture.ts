/**
 * Test fixtures for treasury data
 */

import { testUsers } from './users.fixture';

export const testDeposits = [
  {
    source: 'SPONSOR',
    amount: '100000000', // 1 APT (8 decimals)
    total_balance: '100000000',
    transaction_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    version: 1000,
    block_height: 100,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
  },
  {
    source: 'SPONSOR',
    amount: '200000000', // 2 APT
    total_balance: '300000000',
    transaction_hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
    version: 2000,
    block_height: 200,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
  },
  {
    source: 'MERCH',
    amount: '50000000', // 0.5 APT
    total_balance: '350000000',
    transaction_hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
    version: 3000,
    block_height: 300,
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
  },
  {
    source: 'SPONSOR',
    amount: '150000000', // 1.5 APT
    total_balance: '500000000',
    transaction_hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
    version: 4000,
    block_height: 400,
    timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  },
];

export const testReimbursementRequests = [
  {
    payer: testUsers.eboard_member1.address,
    payee: testUsers.regular_member.address,
    amount: '10000000', // 0.1 APT
    description: 'Hackathon pizza for team',
    paid_out: false,
    created_ts: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
    transaction_hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
    version: 5000,
  },
  {
    payer: testUsers.president.address,
    payee: testUsers.eboard_member2.address,
    amount: '25000000', // 0.25 APT
    description: 'Event supplies and decorations',
    paid_out: true,
    created_ts: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
    transaction_hash: '0x6666666666666666666666666666666666666666666666666666666666666666',
    version: 6000,
  },
  {
    payer: testUsers.vice_president.address,
    payee: testUsers.regular_member.address,
    amount: '15000000', // 0.15 APT
    description: 'Marketing materials printing',
    paid_out: false,
    created_ts: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    transaction_hash: '0x7777777777777777777777777777777777777777777777777777777777777777',
    version: 7000,
  },
];

export const createTestDeposit = (overrides?: any) => ({
  source: 'SPONSOR',
  amount: '100000000',
  total_balance: '100000000',
  transaction_hash: '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
  version: Math.floor(Math.random() * 100000),
  block_height: Math.floor(Math.random() * 10000),
  timestamp: Math.floor(Date.now() / 1000),
  ...overrides,
});

export const createTestReimbursementRequest = (overrides?: any) => ({
  payer: testUsers.president.address,
  payee: testUsers.regular_member.address,
  amount: '10000000',
  description: 'Test reimbursement',
  paid_out: false,
  created_ts: Math.floor(Date.now() / 1000),
  transaction_hash: '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
  version: Math.floor(Math.random() * 100000),
  ...overrides,
});
