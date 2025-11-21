import {
  getProposals as getProposalsFromChain,
  getProposalDetails as getProposalDetailsFromChain,
  getProposalStats as getProposalStatsFromChain,
  StatusNames,
} from './aptos';
import {
  ApiResponse,
  Proposal,
  ProposalDetails,
  ProposalStats,
  TransactionSubmission,
  ProposalFilters,
  Pagination,
} from '../types/api';
import { DEFAULT_CHAIN_ID } from '../chains';

const PLAN_A_CHAIN_ID = DEFAULT_CHAIN_ID;

/**
 * Proposals API module
 * Now uses direct blockchain integration instead of backend API
 */

/**
 * Get all proposals with filtering from blockchain
 */
export async function getProposals(
  filters?: ProposalFilters
): Promise<
  ApiResponse<{
    proposals: Proposal[];
    pagination: Pagination;
  }>
> {
  try {
    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const proposals = await getProposalsFromChain({
      status: filters?.status,
      limit: limit + 1,
      offset,
    });

    const hasMore = proposals.length > limit;
    const paginatedProposals = hasMore ? proposals.slice(0, limit) : proposals;

    // Fetch details for each proposal to get vote stats and status
    const enrichedProposals: Proposal[] = await Promise.all(
      paginatedProposals.map(async (p) => {
        try {
          const details = await getProposalDetailsFromChain(p.proposal_id);

          return {
            chainId: PLAN_A_CHAIN_ID,
            chainIds: [PLAN_A_CHAIN_ID],
            proposal_id: p.proposal_id,
            title: p.title,
            description: '', // Not in ProposalCreatedEvent
            creator: p.creator,
            status: 1, // Would need to fetch from resource or finalize events
            statusName: StatusNames[1] || 'Active',
            yay_votes: '0',
            nay_votes: '0',
            start_ts: p.start_ts,
            end_ts: p.end_ts,
            voteStats: details.voteStats,
          };
        } catch (error) {
          // If details fetch fails, return basic info
          return {
            chainId: PLAN_A_CHAIN_ID,
            chainIds: [PLAN_A_CHAIN_ID],
            proposal_id: p.proposal_id,
            title: p.title,
            description: '',
            creator: p.creator,
            status: 1,
            statusName: 'Active',
            yay_votes: '0',
            nay_votes: '0',
            start_ts: p.start_ts,
            end_ts: p.end_ts,
            voteStats: {
              totalVoters: 0,
              yayVoters: 0,
              nayVoters: 0,
            },
          };
        }
      })
    );

    // Apply creator filter if provided
    let filteredProposals = enrichedProposals;
    if (filters?.creator) {
      filteredProposals = enrichedProposals.filter(
        (p) => p.creator.toLowerCase() === filters.creator!.toLowerCase()
      );
    }

    return {
      success: true,
      data: {
        proposals: filteredProposals,
        pagination: {
          page,
          limit,
          total: offset + proposals.length + (hasMore ? 1 : 0),
          totalPages: Math.ceil((offset + proposals.length + (hasMore ? 1 : 0)) / limit),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposals',
    };
  }
}

/**
 * Get specific proposal details from blockchain
 */
export async function getProposalDetails(
  id: number
): Promise<ApiResponse<ProposalDetails>> {
  try {
    const proposals = await getProposalsFromChain({ limit: 1000 });
    const proposal = proposals.find((p) => p.proposal_id === id);

    if (!proposal) {
      return {
        success: false,
        error: 'Proposal not found',
      };
    }

    const details = await getProposalDetailsFromChain(id);

    const proposalDetails: ProposalDetails = {
      chainId: PLAN_A_CHAIN_ID,
      chainIds: [PLAN_A_CHAIN_ID],
      proposal_id: proposal.proposal_id,
      title: proposal.title,
      description: '',
      creator: proposal.creator,
      status: 1,
      statusName: 'Active',
      yay_votes: '0',
      nay_votes: '0',
      start_ts: proposal.start_ts,
      end_ts: proposal.end_ts,
      voteStats: details.voteStats,
      votes: details.votes,
    };

    return {
      success: true,
      data: proposalDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposal details',
    };
  }
}

/**
 * Create new proposal
 * Note: Transaction should be submitted to blockchain first
 */
export async function createProposal(
  transactionHash: string
): Promise<ApiResponse<TransactionSubmission>> {
  // This is a placeholder - the actual proposal creation happens on-chain
  // This function can be used to store additional metadata if needed
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
 * Vote on proposal
 * Note: Transaction should be submitted to blockchain first
 */
export async function voteOnProposal(
  id: number,
  transactionHash: string
): Promise<ApiResponse<TransactionSubmission>> {
  // This is a placeholder - the actual vote happens on-chain
  // This function can be used to cache vote status if needed
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
 * Get currently active proposals (voting open) from blockchain
 */
export async function getActiveProposals(): Promise<
  ApiResponse<{
    proposals: Proposal[];
    count: number;
  }>
> {
  try {
    const allProposals = await getProposalsFromChain({ limit: 1000 });
    const now = Date.now();

    // Filter for active proposals (current time between start and end)
    const activeProposals = allProposals.filter((p) => {
      const start = new Date(p.start_ts).getTime();
      const end = new Date(p.end_ts).getTime();
      return now >= start && now < end;
    });

    // Enrich with vote stats
    const enrichedProposals: Proposal[] = await Promise.all(
      activeProposals.map(async (p) => {
        try {
          const details = await getProposalDetailsFromChain(p.proposal_id);
          return {
            chainId: PLAN_A_CHAIN_ID,
            chainIds: [PLAN_A_CHAIN_ID],
            proposal_id: p.proposal_id,
            title: p.title,
            description: '',
            creator: p.creator,
            status: 1,
            statusName: 'Active',
            yay_votes: '0',
            nay_votes: '0',
            start_ts: p.start_ts,
            end_ts: p.end_ts,
            voteStats: details.voteStats,
          };
        } catch (error) {
          return {
            chainId: PLAN_A_CHAIN_ID,
            chainIds: [PLAN_A_CHAIN_ID],
            proposal_id: p.proposal_id,
            title: p.title,
            description: '',
            creator: p.creator,
            status: 1,
            statusName: 'Active',
            yay_votes: '0',
            nay_votes: '0',
            start_ts: p.start_ts,
            end_ts: p.end_ts,
            voteStats: {
              totalVoters: 0,
              yayVoters: 0,
              nayVoters: 0,
            },
          };
        }
      })
    );

    return {
      success: true,
      data: {
        proposals: enrichedProposals,
        count: enrichedProposals.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active proposals',
    };
  }
}

/**
 * Get proposal statistics from blockchain
 */
export async function getProposalStats(): Promise<ApiResponse<ProposalStats>> {
  try {
    const stats = await getProposalStatsFromChain();

    // Fetch recent proposals
    const recentProposals = await getProposalsFromChain({ limit: 5 });
    const recentProposalsList = recentProposals.map((p) => ({
      chainId: PLAN_A_CHAIN_ID,
      chainIds: [PLAN_A_CHAIN_ID],
      proposal_id: p.proposal_id,
      title: p.title,
      creator: p.creator,
      status: 1,
      statusName: 'Active',
      start_ts: p.start_ts,
      end_ts: p.end_ts,
    }));

    return {
      success: true,
      data: {
        ...stats,
        recentProposals: recentProposalsList,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch proposal stats',
    };
  }
}
