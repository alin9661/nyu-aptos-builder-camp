/**
 * React Hooks Export Index
 *
 * This file exports all custom React hooks for convenient importing.
 *
 * Usage:
 * import { useTreasuryBalance, useProposals } from '@/hooks';
 */

// Re-export treasury hooks
export {
  useTreasuryBalance,
  useTreasuryTransactions,
  useTreasuryStats,
  useReimbursements,
  useReimbursementDetails,
} from './useTreasury';

// Re-export governance hooks
export {
  useElections,
  useElectionDetails,
  useRoles,
  useMembers,
  useGovernanceStats,
} from './useGovernance';

// Re-export proposals hooks
export {
  useProposals,
  useProposalDetails,
  useActiveProposals,
  useProposalStats,
} from './useProposals';

// Re-export auth hooks
export {
  useHealthCheck,
  useApiInfo,
} from './useAuth';

// Re-export wallet hook
export { useWallet } from '@/lib/wallet/AptosWalletProvider';
