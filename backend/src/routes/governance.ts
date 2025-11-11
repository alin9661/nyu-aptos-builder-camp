import { Router, Request, Response } from 'express';
import { aptos } from '../config/aptos';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { validateQuery, paginationSchema } from '../utils/validators';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/governance/elections
 * Get all elections with filtering options
 */
router.get('/elections', validateQuery(paginationSchema), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'desc' } = req.query as any;
    const { role, status } = req.query;

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role_name = $${paramIndex++}`);
      params.push(role);
    }

    if (status !== undefined) {
      conditions.push(`finalized = $${paramIndex++}`);
      params.push(status === 'finalized');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM elections ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    // Get paginated elections
    params.push(limit, offset);
    const elections = await query(
      `SELECT
        e.*,
        u.display_name as winner_name
      FROM elections e
      LEFT JOIN users u ON e.winner = u.address
      ${whereClause}
      ORDER BY e.start_ts ${sort === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    // Get candidates for each election
    const electionsWithCandidates = await Promise.all(
      elections.map(async (election) => {
        const candidates = await query(
          `SELECT
            c.candidate,
            u.display_name,
            c.timestamp
          FROM election_candidates c
          LEFT JOIN users u ON c.candidate = u.address
          WHERE c.election_id = $1 AND c.role_name = $2
          ORDER BY c.timestamp ASC`,
          [election.election_id, election.role_name]
        );

        // Get vote tallies if finalized
        let tallies: any[] = [];
        if (election.finalized) {
          tallies = await query(
            `SELECT
              candidate,
              SUM(weight) as total_weight,
              COUNT(*) as vote_count
            FROM election_votes
            WHERE election_id = $1 AND role_name = $2
            GROUP BY candidate
            ORDER BY total_weight DESC`,
            [election.election_id, election.role_name]
          );
        }

        return {
          ...election,
          candidates,
          tallies: tallies.map(t => ({
            ...t,
            total_weight: t.total_weight.toString(),
          })),
        };
      })
    );

    return res.json({
      success: true,
      data: {
        elections: electionsWithCandidates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch elections', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch elections',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/governance/elections/:electionId/:role
 * Get specific election details
 */
router.get('/elections/:electionId/:role', async (req: Request, res: Response) => {
  try {
    const { electionId, role } = req.params;

    const elections = await query(
      `SELECT
        e.*,
        u.display_name as winner_name
      FROM elections e
      LEFT JOIN users u ON e.winner = u.address
      WHERE e.election_id = $1 AND e.role_name = $2`,
      [electionId, role]
    );

    if (elections.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const election = elections[0];

    // Get candidates
    const candidates = await query(
      `SELECT
        c.candidate,
        u.display_name,
        c.timestamp
      FROM election_candidates c
      LEFT JOIN users u ON c.candidate = u.address
      WHERE c.election_id = $1 AND c.role_name = $2
      ORDER BY c.timestamp ASC`,
      [electionId, role]
    );

    // Get votes
    const votes = await query(
      `SELECT
        v.voter,
        v.candidate,
        v.weight,
        v.timestamp,
        u1.display_name as voter_name,
        u2.display_name as candidate_name
      FROM election_votes v
      LEFT JOIN users u1 ON v.voter = u1.address
      LEFT JOIN users u2 ON v.candidate = u2.address
      WHERE v.election_id = $1 AND v.role_name = $2
      ORDER BY v.timestamp DESC`,
      [electionId, role]
    );

    // Get tallies
    const tallies = await query(
      `SELECT
        candidate,
        SUM(weight) as total_weight,
        COUNT(*) as vote_count
      FROM election_votes
      WHERE election_id = $1 AND role_name = $2
      GROUP BY candidate
      ORDER BY total_weight DESC`,
      [electionId, role]
    );

    return res.json({
      success: true,
      data: {
        ...election,
        candidates,
        votes: votes.map(v => ({
          ...v,
          weight: v.weight.toString(),
        })),
        tallies: tallies.map(t => ({
          ...t,
          total_weight: t.total_weight.toString(),
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch election details', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch election details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/governance/vote
 * Record vote transaction
 * Requires authentication
 */
router.post('/vote', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
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

    logger.info('Vote cast', { transactionHash, version: txn.version });

    return res.json({
      success: true,
      data: {
        transactionHash,
        version: txn.version,
        success: txn.success,
      },
    });
  } catch (error) {
    logger.error('Failed to process vote', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to process vote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/governance/roles
 * Get current role assignments from blockchain
 */
router.get('/roles', async (_req: Request, res: Response) => {
  try {
    // Note: This would require view functions in the Move module
    // For now, we can get from database if we're tracking role changes
    const roles = await query(`
      SELECT DISTINCT address, role, display_name
      FROM users
      WHERE role IN ('admin', 'advisor', 'president', 'vice_president')
      ORDER BY
        CASE role
          WHEN 'admin' THEN 1
          WHEN 'advisor' THEN 2
          WHEN 'president' THEN 3
          WHEN 'vice_president' THEN 4
        END
    `);

    return res.json({
      success: true,
      data: {
        roles: roles.reduce((acc, user) => {
          acc[user.role] = {
            address: user.address,
            displayName: user.display_name,
          };
          return acc;
        }, {} as Record<string, any>),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch roles', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/governance/members
 * Get all e-board members
 */
router.get('/members', async (_req: Request, res: Response) => {
  try {
    const members = await query(`
      SELECT address, role, display_name, email, created_at
      FROM users
      WHERE role IN ('advisor', 'president', 'vice_president', 'eboard_member')
      ORDER BY
        CASE role
          WHEN 'advisor' THEN 1
          WHEN 'president' THEN 2
          WHEN 'vice_president' THEN 3
          WHEN 'eboard_member' THEN 4
        END,
        display_name ASC
    `);

    return res.json({
      success: true,
      data: {
        members,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch members', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/governance/stats
 * Get governance statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const electionStats = await query(`
      SELECT
        COUNT(*) as total_elections,
        COUNT(*) FILTER (WHERE finalized = true) as finalized_elections,
        COUNT(*) FILTER (WHERE finalized = false) as active_elections,
        COUNT(DISTINCT role_name) as roles_with_elections
      FROM elections
    `);

    const voteStats = await query(`
      SELECT
        COUNT(DISTINCT voter) as unique_voters,
        COUNT(*) as total_votes,
        COALESCE(SUM(weight), 0) as total_weight
      FROM election_votes
    `);

    const recentElections = await query(`
      SELECT
        e.election_id,
        e.role_name,
        e.start_ts,
        e.end_ts,
        e.finalized,
        e.winner,
        u.display_name as winner_name,
        COUNT(c.candidate) as candidate_count
      FROM elections e
      LEFT JOIN users u ON e.winner = u.address
      LEFT JOIN election_candidates c ON e.election_id = c.election_id AND e.role_name = c.role_name
      GROUP BY e.election_id, e.role_name, e.start_ts, e.end_ts, e.finalized, e.winner, u.display_name
      ORDER BY e.start_ts DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        elections: {
          total: parseInt(electionStats[0].total_elections),
          finalized: parseInt(electionStats[0].finalized_elections),
          active: parseInt(electionStats[0].active_elections),
          rolesWithElections: parseInt(electionStats[0].roles_with_elections),
        },
        votes: {
          uniqueVoters: parseInt(voteStats[0]?.unique_voters || 0),
          totalVotes: parseInt(voteStats[0]?.total_votes || 0),
          totalWeight: voteStats[0]?.total_weight?.toString() || '0',
        },
        recentElections,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch governance stats', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch governance stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
