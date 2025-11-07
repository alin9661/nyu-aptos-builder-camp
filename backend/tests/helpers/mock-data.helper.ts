/**
 * Mock data generator for tests
 * Provides consistent test data generation
 */

import { faker } from '@faker-js/faker';

/**
 * Generate test Aptos address
 */
export const generateAddress = (prefix = '0x'): string => {
  const hex = faker.string.hexadecimal({ length: 64, prefix: '', casing: 'lower' });
  return `${prefix}${hex}`;
};

/**
 * Generate test transaction hash
 */
export const generateTxHash = (): string => {
  return '0x' + faker.string.hexadecimal({ length: 64, prefix: '', casing: 'lower' });
};

/**
 * Generate test IPFS hash
 */
export const generateIpfsHash = (): string => {
  return 'Qm' + faker.string.alphanumeric(44);
};

/**
 * Generate test user data
 */
export const generateUser = (overrides?: Partial<TestUser>): TestUser => {
  return {
    address: generateAddress(),
    role: faker.helpers.arrayElement(['admin', 'advisor', 'president', 'vice_president', 'eboard_member', 'member']),
    display_name: faker.person.fullName(),
    email: faker.internet.email(),
    ...overrides,
  };
};

/**
 * Generate test treasury deposit
 */
export const generateTreasuryDeposit = (overrides?: Partial<TestTreasuryDeposit>): TestTreasuryDeposit => {
  const amount = faker.number.int({ min: 100000000, max: 1000000000 }); // 1-10 coins
  return {
    source: faker.helpers.arrayElement(['SPONSOR', 'MERCH']),
    amount: amount.toString(),
    total_balance: faker.number.int({ min: amount, max: 10000000000 }).toString(),
    transaction_hash: generateTxHash(),
    version: faker.number.int({ min: 1, max: 1000000 }),
    block_height: faker.number.int({ min: 1, max: 1000000 }),
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides,
  };
};

/**
 * Generate test reimbursement request
 */
export const generateReimbursementRequest = (
  overrides?: Partial<TestReimbursementRequest>
): TestReimbursementRequest => {
  return {
    payer: generateAddress(),
    payee: generateAddress(),
    amount: faker.number.int({ min: 1000000, max: 100000000 }).toString(), // 0.01-1 coin
    description: faker.lorem.sentence(),
    paid_out: faker.datatype.boolean(),
    created_ts: Math.floor(Date.now() / 1000),
    transaction_hash: generateTxHash(),
    version: faker.number.int({ min: 1, max: 1000000 }),
    ...overrides,
  };
};

/**
 * Generate test election
 */
export const generateElection = (overrides?: Partial<TestElection>): TestElection => {
  const now = Math.floor(Date.now() / 1000);
  return {
    election_id: faker.number.int({ min: 0, max: 100 }),
    role_name: faker.helpers.arrayElement(['president', 'vice_president', 'treasurer']),
    start_ts: now - 86400,
    end_ts: now + 86400,
    finalized: false,
    winner: null,
    ...overrides,
  };
};

/**
 * Generate test election candidate
 */
export const generateElectionCandidate = (
  overrides?: Partial<TestElectionCandidate>
): TestElectionCandidate => {
  return {
    election_id: faker.number.int({ min: 0, max: 100 }),
    role_name: faker.helpers.arrayElement(['president', 'vice_president', 'treasurer']),
    candidate: generateAddress(),
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides,
  };
};

/**
 * Generate test proposal
 */
export const generateProposal = (overrides?: Partial<TestProposal>): TestProposal => {
  const now = Math.floor(Date.now() / 1000);
  return {
    proposal_id: faker.number.int({ min: 0, max: 1000 }),
    creator: generateAddress(),
    title: faker.lorem.words(5),
    description: faker.lorem.paragraph(),
    status: faker.number.int({ min: 0, max: 4 }),
    start_ts: now,
    end_ts: now + 86400,
    yay_votes: faker.number.int({ min: 0, max: 100 }).toString(),
    nay_votes: faker.number.int({ min: 0, max: 100 }).toString(),
    ...overrides,
  };
};

/**
 * Generate test proposal vote
 */
export const generateProposalVote = (overrides?: Partial<TestProposalVote>): TestProposalVote => {
  return {
    proposal_id: faker.number.int({ min: 0, max: 1000 }),
    voter: generateAddress(),
    vote: faker.datatype.boolean(),
    weight: faker.number.int({ min: 1, max: 3 }).toString(),
    timestamp: Math.floor(Date.now() / 1000),
    ...overrides,
  };
};

/**
 * Generate test invoice metadata
 */
export const generateInvoiceMetadata = (
  overrides?: Partial<TestInvoiceMetadata>
): TestInvoiceMetadata => {
  return {
    request_id: faker.number.int({ min: 1, max: 1000 }),
    ipfs_hash: generateIpfsHash(),
    file_name: faker.system.fileName(),
    file_size: faker.number.int({ min: 1024, max: 10 * 1024 * 1024 }),
    mime_type: faker.helpers.arrayElement(['application/pdf', 'image/png', 'image/jpeg']),
    uploaded_at: new Date(),
    verified_on_chain: faker.datatype.boolean(),
    ...overrides,
  };
};

/**
 * Generate test nonce
 */
export const generateNonce = (): string => {
  return faker.string.hexadecimal({ length: 32, prefix: '', casing: 'lower' });
};

/**
 * Generate test JWT payload
 */
export const generateJwtPayload = (overrides?: Partial<TestJwtPayload>): TestJwtPayload => {
  const now = Math.floor(Date.now() / 1000);
  return {
    address: generateAddress(),
    role: faker.helpers.arrayElement(['admin', 'advisor', 'president', 'member']),
    iat: now,
    exp: now + 900, // 15 minutes
    ...overrides,
  };
};

/**
 * Generate test file buffer
 */
export const generateFileBuffer = (sizeInBytes = 1024): Buffer => {
  return Buffer.alloc(sizeInBytes, faker.string.alphanumeric(1));
};

/**
 * Generate batch of users
 */
export const generateUsers = (count: number, overrides?: Partial<TestUser>): TestUser[] => {
  return Array.from({ length: count }, () => generateUser(overrides));
};

/**
 * Generate batch of treasury deposits
 */
export const generateTreasuryDeposits = (
  count: number,
  overrides?: Partial<TestTreasuryDeposit>
): TestTreasuryDeposit[] => {
  return Array.from({ length: count }, () => generateTreasuryDeposit(overrides));
};

/**
 * Generate batch of reimbursement requests
 */
export const generateReimbursementRequests = (
  count: number,
  overrides?: Partial<TestReimbursementRequest>
): TestReimbursementRequest[] => {
  return Array.from({ length: count }, () => generateReimbursementRequest(overrides));
};

/**
 * Generate batch of proposals
 */
export const generateProposals = (
  count: number,
  overrides?: Partial<TestProposal>
): TestProposal[] => {
  return Array.from({ length: count }, () => generateProposal(overrides));
};

// Type definitions
export interface TestUser {
  address: string;
  role: string;
  display_name: string;
  email: string;
}

export interface TestTreasuryDeposit {
  source: string;
  amount: string;
  total_balance: string;
  transaction_hash: string;
  version: number;
  block_height: number;
  timestamp: number;
}

export interface TestReimbursementRequest {
  payer: string;
  payee: string;
  amount: string;
  description: string;
  paid_out: boolean;
  created_ts: number;
  transaction_hash: string;
  version: number;
}

export interface TestElection {
  election_id: number;
  role_name: string;
  start_ts: number;
  end_ts: number;
  finalized: boolean;
  winner: string | null;
}

export interface TestElectionCandidate {
  election_id: number;
  role_name: string;
  candidate: string;
  timestamp: number;
}

export interface TestProposal {
  proposal_id: number;
  creator: string;
  title: string;
  description: string;
  status: number;
  start_ts: number;
  end_ts: number;
  yay_votes: string;
  nay_votes: string;
}

export interface TestProposalVote {
  proposal_id: number;
  voter: string;
  vote: boolean;
  weight: string;
  timestamp: number;
}

export interface TestInvoiceMetadata {
  request_id: number;
  ipfs_hash: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: Date;
  verified_on_chain: boolean;
}

export interface TestJwtPayload {
  address: string;
  role: string;
  iat: number;
  exp: number;
}
