import { Router, Request, Response } from 'express';
import { aptos, MODULES, PROPOSAL_STATUS_NAMES } from '../config/aptos';
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
router.post('/create', verifyAuth, requireEboard, async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process proposal creation', { error });
    res.status(500).json({
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
router.get('/', optionalAuth, validateQuery(paginationSchema), async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposals',
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

    res.json({
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
      },
    });
  } catch (error) {
    logger.error('Failed to fetch proposal details', { error });
    res.status(500).json({
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
router.post('/:id/vote', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process proposal vote', { error });
    res.status(500).json({
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
router.get('/status/active', async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: {
        proposals: proposalsWithVotes,
        count: proposalsWithVotes.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch active proposals', { error });
    res.status(500).json({
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
router.get('/stats/overview', async (req: Request, res: Response) => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
