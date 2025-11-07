/**
 * Mock implementations for Aptos SDK
 * These mocks simulate blockchain interactions for testing
 */

import { jest } from '@jest/globals';

/**
 * Mock transaction response
 */
export const createMockTransaction = (overrides?: any) => ({
  version: '123456',
  hash: '0x' + '1'.repeat(64),
  success: true,
  vm_status: 'Executed successfully',
  gas_used: '1000',
  sender: '0x1',
  sequence_number: '1',
  max_gas_amount: '10000',
  gas_unit_price: '100',
  expiration_timestamp_secs: Math.floor(Date.now() / 1000) + 3600,
  payload: {},
  events: [],
  timestamp: Math.floor(Date.now() / 1000).toString(),
  ...overrides,
});

/**
 * Mock view function response for balance
 */
export const createMockBalanceResponse = (balance: string = '100000000') => {
  return [balance];
};

/**
 * Mock Aptos client
 */
export const createMockAptosClient = () => {
  const mockClient = {
    view: jest.fn().mockResolvedValue(createMockBalanceResponse()),
    waitForTransaction: jest.fn().mockResolvedValue(createMockTransaction()),
    getAccountResource: jest.fn().mockResolvedValue({
      type: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      data: {
        coin: {
          value: '100000000',
        },
      },
    }),
    getTransaction: jest.fn().mockResolvedValue(createMockTransaction()),
    getTransactions: jest.fn().mockResolvedValue([createMockTransaction()]),
    getAccountTransactions: jest.fn().mockResolvedValue([createMockTransaction()]),
    getLedgerInfo: jest.fn().mockResolvedValue({
      chain_id: 2,
      epoch: '100',
      ledger_version: '123456',
      oldest_ledger_version: '0',
      ledger_timestamp: Math.floor(Date.now() / 1000).toString(),
      node_role: 'full_node',
      oldest_block_height: '0',
      block_height: '12345',
    }),
    getEvents: jest.fn().mockResolvedValue([]),
    getIndexerLedgerInfo: jest.fn().mockResolvedValue({
      ledger_version: '123456',
      ledger_timestamp: Math.floor(Date.now() / 1000).toString(),
    }),
  };

  return mockClient as any;
};

/**
 * Mock blockchain events
 */
export const createMockDepositEvent = (overrides?: any) => ({
  type: '0x1::treasury::DepositReceivedEvent',
  guid: {
    creation_number: '1',
    account_address: '0x1',
  },
  sequence_number: '0',
  data: {
    source: 'SPONSOR',
    amount: '100000000',
    total_balance: '500000000',
    ...overrides,
  },
});

export const createMockReimbursementEvent = (overrides?: any) => ({
  type: '0x1::treasury::ReimbursementSubmittedEvent',
  guid: {
    creation_number: '2',
    account_address: '0x1',
  },
  sequence_number: '0',
  data: {
    request_id: 1,
    payer: '0x2',
    payee: '0x3',
    amount: '10000000',
    description: 'Test reimbursement',
    ...overrides,
  },
});

export const createMockProposalCreatedEvent = (overrides?: any) => ({
  type: '0x1::proposals::ProposalCreatedEvent',
  guid: {
    creation_number: '3',
    account_address: '0x1',
  },
  sequence_number: '0',
  data: {
    proposal_id: 1,
    creator: '0x2',
    title: 'Test Proposal',
    description: 'This is a test proposal',
    start_ts: Math.floor(Date.now() / 1000),
    end_ts: Math.floor(Date.now() / 1000) + 86400,
    ...overrides,
  },
});

export const createMockVoteEvent = (overrides?: any) => ({
  type: '0x1::proposals::VoteCastEvent',
  guid: {
    creation_number: '4',
    account_address: '0x1',
  },
  sequence_number: '0',
  data: {
    proposal_id: 1,
    voter: '0x2',
    vote: true,
    weight: '2',
    ...overrides,
  },
});

export const createMockElectionEvent = (overrides?: any) => ({
  type: '0x1::governance::CandidateAddedEvent',
  guid: {
    creation_number: '5',
    account_address: '0x1',
  },
  sequence_number: '0',
  data: {
    election_id: 1,
    role_name: 'president',
    candidate: '0x2',
    ...overrides,
  },
});

/**
 * Helper to mock Aptos module
 */
export const mockAptosModule = () => {
  const mockClient = createMockAptosClient();

  jest.mock('../../src/config/aptos', () => ({
    aptos: mockClient,
    MODULES: {
      GOVERNANCE: '0x1::governance',
      TREASURY: '0x1::treasury',
      PROPOSALS: '0x1::proposals',
    },
    MODULE_ADDRESS: '0x1',
    COIN_TYPE: '0x1::aptos_coin::AptosCoin',
    getNetworkInfo: jest.fn().mockReturnValue({
      network: 'testnet',
      nodeUrl: 'https://testnet.aptoslabs.com/v1',
      indexerUrl: 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql',
      moduleAddress: '0x1',
      coinType: '0x1::aptos_coin::AptosCoin',
    }),
    formatCoinAmount: (amount: bigint | number, decimals = 8): string => {
      const amountBigInt = BigInt(amount);
      const divisor = BigInt(10 ** decimals);
      const integerPart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;

      if (fractionalPart === BigInt(0)) {
        return integerPart.toString();
      }

      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      return `${integerPart}.${fractionalStr.replace(/0+$/, '')}`;
    },
    parseCoinAmount: (amount: string, decimals = 8): bigint => {
      const [integerPart, fractionalPart = ''] = amount.split('.');
      const fractionalPadded = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
      const combined = integerPart + fractionalPadded;
      return BigInt(combined);
    },
    PROPOSAL_STATUS: {
      DRAFT: 0,
      ACTIVE: 1,
      PASSED: 2,
      REJECTED: 3,
      EXECUTED: 4,
    },
    PROPOSAL_STATUS_NAMES: {
      0: 'Draft',
      1: 'Active',
      2: 'Passed',
      3: 'Rejected',
      4: 'Executed',
    },
    EVENT_TYPES: {
      DEPOSIT_RECEIVED: '0x1::treasury::DepositReceivedEvent',
      REIMBURSEMENT_SUBMITTED: '0x1::treasury::ReimbursementSubmittedEvent',
      REIMBURSEMENT_APPROVED: '0x1::treasury::ReimbursementApprovedEvent',
      REIMBURSEMENT_PAID: '0x1::treasury::ReimbursementPaidEvent',
      CANDIDATE_ADDED: '0x1::governance::CandidateAddedEvent',
      VOTE_CAST_GOVERNANCE: '0x1::governance::VoteCastEvent',
      ELECTION_FINALIZED: '0x1::governance::ElectionFinalizedEvent',
      PROPOSAL_CREATED: '0x1::proposals::ProposalCreatedEvent',
      VOTE_CAST_PROPOSAL: '0x1::proposals::VoteCastEvent',
      PROPOSAL_FINALIZED: '0x1::proposals::ProposalFinalizedEvent',
      PROPOSAL_EXECUTED: '0x1::proposals::ProposalExecutedEvent',
    },
    VOTING_WEIGHTS: {
      SCALE: 2,
      EBOARD: 2,
      ADVISOR: 3,
    },
  }));

  return mockClient;
};

/**
 * Reset all Aptos mocks
 */
export const resetAptosMocks = (mockClient: any) => {
  if (mockClient) {
    Object.values(mockClient).forEach((mock: any) => {
      if (typeof mock?.mockReset === 'function') {
        mock.mockReset();
      }
    });
  }
};
