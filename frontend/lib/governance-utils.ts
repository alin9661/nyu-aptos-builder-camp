/**
 * Governance Utility Functions
 * Helper functions for governance features
 */

/**
 * Voting weight constants based on the Move contract
 * contracts/sources/proposals.move and contracts/sources/governance.move
 */
export const VOTING_WEIGHTS = {
  SCALE: 2,
  EBOARD: 2, // E-board member weight (represents 1.0)
  ADVISOR: 3, // Advisor weight (represents 1.5)
} as const;

/**
 * User role types
 */
export enum UserRole {
  Admin = 'admin',
  Advisor = 'advisor',
  President = 'president',
  VicePresident = 'vice_president',
  EboardMember = 'eboard_member',
  Member = 'member',
  None = 'none',
}

/**
 * Proposal status constants matching Move contract
 */
export const PROPOSAL_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
} as const;

/**
 * Get human-readable status name
 */
export function getProposalStatusName(status: number): string {
  switch (status) {
    case PROPOSAL_STATUS.DRAFT:
      return 'Draft';
    case PROPOSAL_STATUS.ACTIVE:
      return 'Active';
    case PROPOSAL_STATUS.PASSED:
      return 'Passed';
    case PROPOSAL_STATUS.REJECTED:
      return 'Rejected';
    case PROPOSAL_STATUS.EXECUTED:
      return 'Executed';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate voting weight based on user role
 */
export function getVotingWeight(role: UserRole): number {
  switch (role) {
    case UserRole.Advisor:
      return VOTING_WEIGHTS.ADVISOR;
    case UserRole.President:
    case UserRole.VicePresident:
    case UserRole.EboardMember:
      return VOTING_WEIGHTS.EBOARD;
    default:
      return 0; // Not eligible to vote
  }
}

/**
 * Check if user is admin
 * @param userAddress - User's wallet address
 * @param adminAddress - Admin wallet address from contract
 */
export function isAdmin(userAddress: string, adminAddress: string): boolean {
  return userAddress.toLowerCase() === adminAddress.toLowerCase();
}

/**
 * Check if user is eligible to vote on proposals
 * Based on governance.move: only e-board members and advisors can vote
 */
export function isEligibleToVoteOnProposals(role: UserRole): boolean {
  return [
    UserRole.Advisor,
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}

/**
 * Check if user is eligible to create proposals
 * Based on proposals.move: only e-board members can create proposals
 */
export function isEligibleToCreateProposals(role: UserRole): boolean {
  return [
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}

/**
 * Check if user is eligible to vote in elections
 * Based on governance.move: e-board members and advisors can vote
 */
export function isEligibleToVoteInElections(role: UserRole): boolean {
  return [
    UserRole.Advisor,
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}

/**
 * Check if user is eligible to run for election
 * Based on governance.move: candidates must be e-board members
 */
export function isEligibleToRunForElection(role: UserRole): boolean {
  return [
    UserRole.President,
    UserRole.VicePresident,
    UserRole.EboardMember,
  ].includes(role);
}

/**
 * Format Aptos address for display
 */
export function formatAddress(address: string, startChars = 8, endChars = 6): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate Aptos address format
 */
export function isValidAptosAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{64}$/;
  return addressRegex.test(address);
}

/**
 * Convert timestamp to human-readable format
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Check if election is active
 */
export function isElectionActive(startTs: string, endTs: string): boolean {
  const now = new Date();
  const start = new Date(startTs);
  const end = new Date(endTs);
  return now >= start && now < end;
}

/**
 * Check if proposal voting is active
 */
export function isProposalActive(startTs: string, endTs: string, status: number): boolean {
  const now = new Date();
  const start = new Date(startTs);
  const end = new Date(endTs);
  return now >= start && now < end && status === PROPOSAL_STATUS.ACTIVE;
}

/**
 * Calculate time remaining for voting
 */
export function getTimeRemaining(endTs: string): string {
  const now = new Date();
  const end = new Date(endTs);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/**
 * Get user role from roles data
 * This should be called after fetching roles from the API
 */
export function getUserRole(
  userAddress: string,
  roles: {
    admin: string;
    advisor: string;
    president: string;
    vice_president: string;
    eboard_members: string[];
  }
): UserRole {
  const addr = userAddress.toLowerCase();

  if (addr === roles.admin.toLowerCase()) return UserRole.Admin;
  if (addr === roles.advisor.toLowerCase()) return UserRole.Advisor;
  if (addr === roles.president.toLowerCase()) return UserRole.President;
  if (addr === roles.vice_president.toLowerCase()) return UserRole.VicePresident;
  if (roles.eboard_members.some(m => m.toLowerCase() === addr)) return UserRole.EboardMember;

  return UserRole.None;
}
