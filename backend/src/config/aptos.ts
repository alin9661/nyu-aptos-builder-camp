import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Network configuration
const NETWORK = (process.env.APTOS_NETWORK || 'testnet') as Network;
const NODE_URL = process.env.APTOS_NODE_URL;
const INDEXER_URL = process.env.APTOS_INDEXER_URL;

// Create Aptos configuration
const config = new AptosConfig({
  network: NETWORK,
  ...(NODE_URL && { fullnode: NODE_URL }),
  ...(INDEXER_URL && { indexer: INDEXER_URL }),
});

// Create Aptos client
export const aptos = new Aptos(config);

// Module addresses (using named addresses from Move.toml)
export const MODULE_ADDRESS = process.env.MODULE_ADDRESS || '0x1'; // Replace with actual deployed address
export const ADVISOR_ADDRESS = process.env.ADVISOR_ADDRESS || '0x2';
export const PRESIDENT_ADDRESS = process.env.PRESIDENT_ADDRESS || '0x3';
export const VICE_ADDRESS = process.env.VICE_ADDRESS || '0x4';

// Module names
export const MODULES = {
  GOVERNANCE: `${MODULE_ADDRESS}::governance`,
  TREASURY: `${MODULE_ADDRESS}::treasury`,
  PROPOSALS: `${MODULE_ADDRESS}::proposals`,
} as const;

// Coin type for treasury (e.g., USDC on testnet)
export const COIN_TYPE = process.env.COIN_TYPE || '0x1::aptos_coin::AptosCoin';

// Network info
export const getNetworkInfo = () => ({
  network: NETWORK,
  nodeUrl: NODE_URL || config.fullnode,
  indexerUrl: INDEXER_URL || config.indexer,
  moduleAddress: MODULE_ADDRESS,
  coinType: COIN_TYPE,
});

// Helper to format coin amount (from on-chain to human-readable)
export const formatCoinAmount = (amount: bigint | number, decimals = 8): string => {
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;

  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  return `${integerPart}.${fractionalStr.replace(/0+$/, '')}`;
};

// Helper to parse coin amount (from human-readable to on-chain)
export const parseCoinAmount = (amount: string, decimals = 8): bigint => {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const fractionalPadded = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const combined = integerPart + fractionalPadded;
  return BigInt(combined);
};

// Event types mapping
export const EVENT_TYPES = {
  // Treasury events
  DEPOSIT_RECEIVED: `${MODULE_ADDRESS}::treasury::DepositReceivedEvent`,
  REIMBURSEMENT_SUBMITTED: `${MODULE_ADDRESS}::treasury::ReimbursementSubmittedEvent`,
  REIMBURSEMENT_APPROVED: `${MODULE_ADDRESS}::treasury::ReimbursementApprovedEvent`,
  REIMBURSEMENT_PAID: `${MODULE_ADDRESS}::treasury::ReimbursementPaidEvent`,

  // Governance events
  CANDIDATE_ADDED: `${MODULE_ADDRESS}::governance::CandidateAddedEvent`,
  VOTE_CAST_GOVERNANCE: `${MODULE_ADDRESS}::governance::VoteCastEvent`,
  ELECTION_FINALIZED: `${MODULE_ADDRESS}::governance::ElectionFinalizedEvent`,

  // Proposal events
  PROPOSAL_CREATED: `${MODULE_ADDRESS}::proposals::ProposalCreatedEvent`,
  VOTE_CAST_PROPOSAL: `${MODULE_ADDRESS}::proposals::VoteCastEvent`,
  PROPOSAL_FINALIZED: `${MODULE_ADDRESS}::proposals::ProposalFinalizedEvent`,
  PROPOSAL_EXECUTED: `${MODULE_ADDRESS}::proposals::ProposalExecutedEvent`,
} as const;

// Status constants
export const PROPOSAL_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
} as const;

export const PROPOSAL_STATUS_NAMES: Record<number, string> = {
  [PROPOSAL_STATUS.DRAFT]: 'Draft',
  [PROPOSAL_STATUS.ACTIVE]: 'Active',
  [PROPOSAL_STATUS.PASSED]: 'Passed',
  [PROPOSAL_STATUS.REJECTED]: 'Rejected',
  [PROPOSAL_STATUS.EXECUTED]: 'Executed',
};

// Voting weights (from Move modules)
export const VOTING_WEIGHTS = {
  SCALE: 2,
  EBOARD: 2,
  ADVISOR: 3,
} as const;
