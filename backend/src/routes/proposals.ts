import { Router, Request, Response } from 'express';
import { aptos, PROPOSAL_STATUS_NAMES, formatCoinAmount } from '../config/aptos';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { validateQuery, paginationSchema } from '../utils/validators';
import { verifyAuth, optionalAuth, requireEboard, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/proposals/create
 * Record proposal creation transaction
 * Requires authentication - E-board or higher
 */
router.post('/create', verifyAuth as any, requireEboard as any, async (req: any, res: Response) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
    }

    // Wait for transaction to be indexed
    const txn = await aptos.waitForTransaction({
      transactionHash,
    });

    logger.info('Proposal created', { transactionHash, version: txn.version });

    return res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process proposal creation', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to process proposal creation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals
 * Get all proposals with filtering
 * Optional authentication - adds user context if authenticated
 */
router.get('/', optionalAuth as any, validateQuery(paginationSchema), async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'desc' } = req.query as any;
    const { status, creator } = req.query;

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(parseInt(status as string));
    }

    if (creator) {
      conditions.push(`creator = $${paramIndex++}`);
      params.push(creator);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM proposals ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    // Get paginated proposals
    params.push(limit, offset);
    const proposals = await query(
      `SELECT
        p.*,
        u.display_name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.creator = u.address
      ${whereClause}
      ORDER BY p.start_ts ${sort === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    const chainActionsMap = await buildProposalChainActions(proposals);

    // Get vote counts for each proposal
    const proposalsWithVotes = await Promise.all(
      proposals.map(async (proposal) => {
        const voteStats = await query(
          `SELECT
            COUNT(*) as total_voters,
            COUNT(*) FILTER (WHERE vote = true) as yay_voters,
            COUNT(*) FILTER (WHERE vote = false) as nay_voters
          FROM proposal_votes
          WHERE proposal_id = $1`,
          [proposal.proposal_id]
        );

        return {
          ...proposal,
          yay_votes: proposal.yay_votes.toString(),
          nay_votes: proposal.nay_votes.toString(),
          statusName: PROPOSAL_STATUS_NAMES[proposal.status],
          voteStats: {
            totalVoters: parseInt(voteStats[0]?.total_voters || 0),
            yayVoters: parseInt(voteStats[0]?.yay_voters || 0),
            nayVoters: parseInt(voteStats[0]?.nay_voters || 0),
          },
          chainActions: chainActionsMap[Number(proposal.proposal_id)] || [],
        };
      })
    );

    return res.json({
      success: true,
      data: {
        proposals: proposalsWithVotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposals', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals/actions
 * Get chain actions for multiple proposals (ids query parameter)
 */
router.get('/actions', async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam) {
      return res.status(400).json({
        success: false,
        error: 'ids query parameter is required',
      });
    }

    const idList = Array.isArray(idsParam)
      ? idsParam
          .flatMap(id => String(id).split(','))
          .map(id => id.trim())
      : String(idsParam)
          .split(',')
          .map(id => id.trim());

    const proposalIds = idList
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id));

    if (proposalIds.length === 0) {
      return res.json({
        success: true,
        data: {
          actions: {},
        },
      });
    }

    const proposals = await query(
      `SELECT proposal_id, status, executed, updated_at
       FROM proposals
       WHERE proposal_id = ANY($1::bigint[])`,
      [proposalIds]
    );

    const normalizedProposals = proposalIds.map(id => {
      const existing = proposals.find(p => Number(p.proposal_id) === id);
      if (existing) {
        return existing;
      }
      return {
        proposal_id: id,
        status: null,
        executed: false,
        updated_at: null,
      };
    });

    const actionsMap = await buildProposalChainActions(normalizedProposals);

    return res.json({
      success: true,
      data: {
        actions: actionsMap,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal actions', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal actions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals/:id/actions
 * Get chain actions for a single proposal
 */
router.get('/:id/actions', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposal id',
      });
    }

    const proposals = await query(
      `SELECT proposal_id, status, executed, updated_at
       FROM proposals
       WHERE proposal_id = $1`,
      [id]
    );

    const normalized = proposals.length
      ? proposals
      : [
          {
            proposal_id: id,
            status: null,
            executed: false,
            updated_at: null,
          },
        ];

    const actionsMap = await buildProposalChainActions(normalized);

    return res.json({
      success: true,
      data: {
        actions: actionsMap[id] || [],
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal actions', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal actions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals/:id
 * Get specific proposal details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proposals = await query(
      `SELECT
        p.*,
        u.display_name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.creator = u.address
      WHERE p.proposal_id = $1`,
      [id]
    );

    if (proposals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    const proposal = proposals[0];

    // Get votes
    const votes = await query(
      `SELECT
        v.voter,
        v.vote,
        v.weight,
        v.timestamp,
        u.display_name as voter_name
      FROM proposal_votes v
      LEFT JOIN users u ON v.voter = u.address
      WHERE v.proposal_id = $1
      ORDER BY v.timestamp DESC`,
      [id]
    );

    // Get vote statistics
    const voteStats = await query(
      `SELECT
        COUNT(*) as total_voters,
        COUNT(*) FILTER (WHERE vote = true) as yay_voters,
        COUNT(*) FILTER (WHERE vote = false) as nay_voters,
        SUM(weight) FILTER (WHERE vote = true) as yay_weight,
        SUM(weight) FILTER (WHERE vote = false) as nay_weight
      FROM proposal_votes
      WHERE proposal_id = $1`,
      [id]
    );

    const chainActionsMap = await buildProposalChainActions([proposal]);

    return res.json({
      success: true,
      data: {
        ...proposal,
        yay_votes: proposal.yay_votes.toString(),
        nay_votes: proposal.nay_votes.toString(),
        statusName: PROPOSAL_STATUS_NAMES[proposal.status],
        votes: votes.map(v => ({
          ...v,
          weight: v.weight.toString(),
        })),
        voteStats: {
          totalVoters: parseInt(voteStats[0]?.total_voters || 0),
          yayVoters: parseInt(voteStats[0]?.yay_voters || 0),
          nayVoters: parseInt(voteStats[0]?.nay_voters || 0),
          yayWeight: voteStats[0]?.yay_weight?.toString() || '0',
          nayWeight: voteStats[0]?.nay_weight?.toString() || '0',
        },
        chainActions: chainActionsMap[Number(proposal.proposal_id)] || [],
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal details', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/proposals/:id/vote
 * Record vote on proposal transaction
 * Requires authentication
 */
router.post('/:id/vote', verifyAuth as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
    }

    // Wait for transaction to be indexed
    const txn = await aptos.waitForTransaction({
      transactionHash,
    });

    logger.info('Vote cast on proposal', { proposalId: id, transactionHash, version: txn.version });

    return res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process proposal vote', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to process proposal vote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals/active
 * Get currently active proposals (voting open)
 */
router.get('/status/active', async (_req: Request, res: Response) => {
  try {
    const now = Math.floor(Date.now() / 1000);

    const proposals = await query(
      `SELECT
        p.*,
        u.display_name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.creator = u.address
      WHERE p.status = 1
        AND p.start_ts <= $1
        AND p.end_ts > $1
      ORDER BY p.end_ts ASC`,
      [now]
    );

    // Get vote counts for each proposal
    const proposalsWithVotes = await Promise.all(
      proposals.map(async (proposal) => {
        const voteStats = await query(
          `SELECT
            COUNT(*) as total_voters,
            COUNT(*) FILTER (WHERE vote = true) as yay_voters,
            COUNT(*) FILTER (WHERE vote = false) as nay_voters
          FROM proposal_votes
          WHERE proposal_id = $1`,
          [proposal.proposal_id]
        );

        return {
          ...proposal,
          yay_votes: proposal.yay_votes.toString(),
          nay_votes: proposal.nay_votes.toString(),
          statusName: PROPOSAL_STATUS_NAMES[proposal.status],
          voteStats: {
            totalVoters: parseInt(voteStats[0]?.total_voters || 0),
            yayVoters: parseInt(voteStats[0]?.yay_voters || 0),
            nayVoters: parseInt(voteStats[0]?.nay_voters || 0),
          },
        };
      })
    );

    return res.json({
      success: true,
      data: {
        proposals: proposalsWithVotes,
        count: proposalsWithVotes.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch active proposals', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch active proposals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/proposals/stats
 * Get proposal statistics
 */
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_proposals,
        COUNT(*) FILTER (WHERE status = 1) as active_proposals,
        COUNT(*) FILTER (WHERE status = 2) as passed_proposals,
        COUNT(*) FILTER (WHERE status = 3) as rejected_proposals,
        COUNT(*) FILTER (WHERE status = 4) as executed_proposals
      FROM proposals
    `);

    const voteStats = await query(`
      SELECT
        COUNT(DISTINCT voter) as unique_voters,
        COUNT(*) as total_votes,
        COUNT(*) FILTER (WHERE vote = true) as total_yay,
        COUNT(*) FILTER (WHERE vote = false) as total_nay
      FROM proposal_votes
    `);

    const recentProposals = await query(`
      SELECT
        p.proposal_id,
        p.title,
        p.creator,
        p.status,
        p.start_ts,
        p.end_ts,
        u.display_name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.creator = u.address
      ORDER BY p.start_ts DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        proposals: {
          total: parseInt(stats[0].total_proposals),
          active: parseInt(stats[0].active_proposals),
          passed: parseInt(stats[0].passed_proposals),
          rejected: parseInt(stats[0].rejected_proposals),
          executed: parseInt(stats[0].executed_proposals),
        },
        votes: {
          uniqueVoters: parseInt(voteStats[0]?.unique_voters || 0),
          totalVotes: parseInt(voteStats[0]?.total_votes || 0),
          totalYay: parseInt(voteStats[0]?.total_yay || 0),
          totalNay: parseInt(voteStats[0]?.total_nay || 0),
        },
        recentProposals: recentProposals.map(p => ({
          ...p,
          statusName: PROPOSAL_STATUS_NAMES[p.status],
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal stats', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

type ChainActionDto = {
  chainId: string;
  type: 'REIMBURSE' | 'TRANSFER' | 'UPDATE_ROLE' | 'EXECUTE';
  description: string;
  timestamp?: string;
  metadata?: Record<string, any>;
};

async function buildProposalChainActions(
  proposals: Array<{ proposal_id: number; status?: number | null; executed?: boolean; updated_at?: Date | null }>
): Promise<Record<number, ChainActionDto[]>> {
  const ids = proposals
    .map(proposal => Number(proposal.proposal_id))
    .filter(id => !Number.isNaN(id));

  const actionsById: Record<number, ChainActionDto[]> = {};
  ids.forEach(id => {
    actionsById[id] = [];
  });

  if (ids.length === 0) {
    return actionsById;
  }

  const reimbursementRequests = await query(
    `SELECT
       r.*,
       payer.display_name as payer_name,
       payee.display_name as payee_name
     FROM reimbursement_requests r
     LEFT JOIN users payer ON r.payer = payer.address
     LEFT JOIN users payee ON r.payee = payee.address
     WHERE r.id = ANY($1::bigint[])`,
    [ids]
  );

  reimbursementRequests.forEach(request => {
    const proposalId = Number(request.id);
    if (Number.isNaN(proposalId)) {
      return;
    }
    ensureActionBucket(actionsById, proposalId);

    const amountBigInt = BigInt(request.amount || 0);
    const amountFormatted = `${formatCoinAmount(amountBigInt)} APT`;
    const payerName = request.payer_name || formatAddress(request.payer);
    const payeeName = request.payee_name || formatAddress(request.payee);
    const createdTimestamp =
      request.created_at instanceof Date
        ? request.created_at.toISOString()
        : request.created_ts
        ? new Date(Number(request.created_ts) * 1000).toISOString()
        : undefined;

    actionsById[proposalId].push({
      chainId: 'aptos',
      type: 'REIMBURSE',
      description: `Reimbursement request #${request.id} submitted by ${payerName} for ${amountFormatted} to ${payeeName}`,
      timestamp: createdTimestamp,
      metadata: {
        requestId: request.id,
        payer: request.payer,
        payee: request.payee,
        amount: request.amount?.toString?.() || request.amount,
      },
    });
  });

  const reimbursementPayments = await query(
    `SELECT
       p.*,
       u.display_name as payee_name
     FROM reimbursement_payments p
     LEFT JOIN users u ON p.payee = u.address
     WHERE p.request_id = ANY($1::bigint[])`,
    [ids]
  );

  reimbursementPayments.forEach(payment => {
    const proposalId = Number(payment.request_id);
    if (Number.isNaN(proposalId)) {
      return;
    }
    ensureActionBucket(actionsById, proposalId);
    const amountBigInt = BigInt(payment.amount || 0);
    const amountFormatted = `${formatCoinAmount(amountBigInt)} APT`;
    const payeeName = payment.payee_name || formatAddress(payment.payee);
    const timestamp =
      payment.timestamp instanceof Date ? payment.timestamp.toISOString() : undefined;

    actionsById[proposalId].push({
      chainId: 'aptos',
      type: 'TRANSFER',
      description: `Transferred ${amountFormatted} to ${payeeName} as reimbursement #${payment.request_id}`,
      timestamp,
      metadata: {
        payee: payment.payee,
        amount: payment.amount?.toString?.() || payment.amount,
        transactionHash: payment.transaction_hash,
      },
    });
  });

  const electionRows = await query(
    `SELECT
       e.election_id,
       e.role_name,
       e.winner,
       e.finalized,
       e.updated_at,
       u.display_name as winner_name
     FROM elections e
     LEFT JOIN users u ON e.winner = u.address
     WHERE e.election_id = ANY($1::bigint[])`,
    [ids]
  );

  electionRows.forEach(election => {
    const proposalId = Number(election.election_id);
    if (Number.isNaN(proposalId)) {
      return;
    }
    ensureActionBucket(actionsById, proposalId);
    const roleName = formatRoleName(election.role_name);
    const winnerLabel = election.winner
      ? election.winner_name || formatAddress(election.winner)
      : 'TBD';
    const description = election.finalized
      ? `Updated ${roleName} role to ${winnerLabel}`
      : `Election in progress for ${roleName}`;
    const timestamp =
      election.updated_at instanceof Date ? election.updated_at.toISOString() : undefined;

    actionsById[proposalId].push({
      chainId: 'aptos',
      type: 'UPDATE_ROLE',
      description,
      timestamp,
      metadata: {
        role: election.role_name,
        winner: election.winner,
        finalized: election.finalized,
      },
    });
  });

  proposals.forEach(proposal => {
    const proposalId = Number(proposal.proposal_id);
    if (Number.isNaN(proposalId)) {
      return;
    }

    if (proposal.executed || proposal.status === 4) {
      ensureActionBucket(actionsById, proposalId);
      const timestamp =
        proposal.updated_at instanceof Date ? proposal.updated_at.toISOString() : undefined;

      actionsById[proposalId].push({
        chainId: 'aptos',
        type: 'EXECUTE',
        description: 'Proposal executed on Aptos',
        timestamp,
        metadata: {
          status: proposal.status,
        },
      });
    }
  });

  return actionsById;
}

function ensureActionBucket(map: Record<number, ChainActionDto[]>, proposalId: number) {
  if (!map[proposalId]) {
    map[proposalId] = [];
  }
}

function formatAddress(address?: string | null): string {
  if (!address) {
    return 'Unknown';
  }
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRoleName(roleName?: string | null): string {
  if (!roleName) {
    return 'Role';
  }

  return roleName
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
