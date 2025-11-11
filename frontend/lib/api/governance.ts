import {
  getElections as getElectionsFromChain,
  getGovernanceStats as getGovernanceStatsFromChain,
  getRoles as getRolesFromChain,
} from './aptos';
import {
  ApiResponse,
  Election,
  ElectionDetails,
  GovernanceStats,
  Member,
  TransactionSubmission,
  ElectionFilters,
  Pagination,
} from '../types/api';

/**
 * Governance API module
 * Now uses direct blockchain integration instead of backend API
 */

/**
 * Get elections with filtering from blockchain
 */
export async function getElections(
  filters?: ElectionFilters
): Promise<
  ApiResponse<{
    elections: Election[];
    pagination: Pagination;
  }>
> {
  try {
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const allElections = await getElectionsFromChain({
      role: filters?.role,
      status: filters?.status,
      limit: limit + 1,
      offset,
    });

    const hasMore = allElections.length > limit;
    const elections = hasMore ? allElections.slice(0, limit) : allElections;

    // Transform to match Election type
    const formattedElections: Election[] = elections.map((e) => ({
      election_id: e.election_id,
      role_name: e.role_name,
      start_ts: e.start_ts || new Date().toISOString(),
      end_ts: e.end_ts || new Date().toISOString(),
      finalized: !!e.finalized,
      winner: e.winner,
      candidates: e.candidates || [],
      tallies: [], // Would need to fetch from vote events
    }));

    return {
      success: true,
      data: {
        elections: formattedElections,
        pagination: {
          page,
          limit,
          total: offset + elections.length + (hasMore ? 1 : 0),
          totalPages: Math.ceil((offset + elections.length + (hasMore ? 1 : 0)) / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch elections',
    };
  }
}

/**
 * Get specific election details from blockchain
 */
export async function getElectionDetails(
  electionId: number,
  role: string
): Promise<ApiResponse<ElectionDetails>> {
  try {
    const allElections = await getElectionsFromChain({ limit: 1000 });
    const election = allElections.find(
      (e) => e.election_id === electionId && e.role_name === role
    );

    if (!election) {
      return {
        success: false,
        error: 'Election not found',
      };
    }

    // Note: Would need to fetch vote events for this specific election
    const electionDetails: ElectionDetails = {
      election_id: election.election_id,
      role_name: election.role_name,
      start_ts: election.start_ts || new Date().toISOString(),
      end_ts: election.end_ts || new Date().toISOString(),
      finalized: !!election.finalized,
      winner: election.winner,
      candidates: election.candidates || [],
      tallies: [],
      votes: [], // Would fetch from VoteCastEvent filtered by election_id
    };

    return {
      success: true,
      data: electionDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch election details',
    };
  }
}

/**
 * Cast vote in election
 * Note: Transaction should be submitted to blockchain first
 */
export async function castVote(
  transactionHash: string
): Promise<ApiResponse<TransactionSubmission>> {
  // This is a placeholder - the actual vote happens on-chain
  return {
    success: true,
    data: {
      transactionHash,
      version: '0',
      success: true,
    },
  };
}

/**
 * Get current role assignments from blockchain
 */
export async function getRoles(): Promise<
  ApiResponse<{
    roles: Record<string, { address: string; displayName: string }>;
  }>
> {
  try {
    const roles = await getRolesFromChain();

    return {
      success: true,
      data: {
        roles,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles',
    };
  }
}

/**
 * Get e-board members from blockchain
 */
export async function getMembers(): Promise<
  ApiResponse<{
    members: Member[];
  }>
> {
  try {
    const roles = await getRolesFromChain();

    // Convert roles to members list
    const members: Member[] = Object.entries(roles).map(([role, data]) => ({
      address: data.address,
      role: role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      display_name: data.displayName,
      created_at: new Date().toISOString(), // Not available on-chain
    }));

    return {
      success: true,
      data: {
        members,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch members',
    };
  }
}

/**
 * Get governance statistics from blockchain
 */
export async function getGovernanceStats(): Promise<ApiResponse<GovernanceStats>> {
  try {
    const stats = await getGovernanceStatsFromChain();

    // Fetch recent elections for the stats
    const recentElections = await getElectionsFromChain({ limit: 5 });

    const recentElectionsList = recentElections.map((e) => ({
      election_id: e.election_id,
      role_name: e.role_name,
      start_ts: e.start_ts || new Date().toISOString(),
      end_ts: e.end_ts || new Date().toISOString(),
      finalized: !!e.finalized,
      winner: e.winner,
      candidate_count: e.candidates?.length || 0,
    }));

    return {
      success: true,
      data: {
        ...stats,
        recentElections: recentElectionsList,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch governance stats',
    };
  }
}
