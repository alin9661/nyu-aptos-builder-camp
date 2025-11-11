/**
 * API Client Export Index
 *
 * This file exports all API functions for convenient importing.
 *
 * Usage:
 * import { getTreasuryBalance, getProposals } from '@/lib/api';
 */

// Re-export client
export { apiClient, createApiClient, ApiError } from './client';
export type { RequestOptions } from './client';

// Re-export treasury API
export {
  getTreasuryBalance,
  getTreasuryTransactions,
  getTreasuryStats,
  getReimbursements,
  getReimbursementDetails,
  submitReimbursement,
  approveReimbursement,
} from './treasury';

// Re-export governance API
export {
  getElections,
  getElectionDetails,
  castVote,
  getRoles,
  getMembers,
  getGovernanceStats,
} from './governance';

// Re-export proposals API
export {
  getProposals,
  getProposalDetails,
  createProposal,
  voteOnProposal,
  getActiveProposals,
  getProposalStats,
} from './proposals';

// Re-export auth API
export {
  getHealthStatus,
  getApiInfo,
} from './auth';
