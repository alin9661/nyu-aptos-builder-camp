import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getEventService, EventChannel } from '../services/events';
import { logger } from '../utils/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * SSE endpoint - establishes a Server-Sent Events connection
 * GET /api/events/stream?channels=treasury:deposit,proposals:new&token=xxx
 */
router.get('/stream', (req: Request, res: Response) => {
  try {
    const eventService = getEventService();

    // Get channels from query parameter
    const channelsParam = req.query.channels as string;
    if (!channelsParam) {
      return res.status(400).json({
        success: false,
        error: 'Missing channels parameter',
        example: '/api/events/stream?channels=treasury:deposit,proposals:new',
      });
    }

    const requestedChannels = channelsParam.split(',').map((c) => c.trim());
    const validChannels = Object.values(EventChannel);
    const channels = requestedChannels.filter((ch) => validChannels.includes(ch as EventChannel));

    if (channels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid channels specified',
        validChannels,
      });
    }

    // Optional authentication
    let address = 'anonymous';
    let authenticated = false;

    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
        address = decoded.address;
        authenticated = true;
        logger.debug('SSE connection authenticated', { address, channels });
      } catch (error) {
        logger.warn('SSE authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Generate unique connection ID
    const connectionId = `${address}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Register SSE connection
    eventService.registerConnection(connectionId, res, channels, address, authenticated);

    logger.info('SSE stream established', {
      connectionId,
      address,
      authenticated,
      channels,
    });
  } catch (error) {
    logger.error('Failed to establish SSE stream', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to establish SSE stream',
    });
  }
});

/**
 * Polling endpoint - get recent events (fallback for SSE)
 * GET /api/events/poll?channels=treasury:deposit&since=1234567890
 */
router.get('/poll', (req: Request, res: Response) => {
  try {
    const eventService = getEventService();

    // Get channels
    const channelsParam = req.query.channels as string;
    if (!channelsParam) {
      return res.status(400).json({
        success: false,
        error: 'Missing channels parameter',
      });
    }

    const channels = channelsParam.split(',').map((c) => c.trim());
    const validChannels = Object.values(EventChannel);

    const validRequestedChannels = channels.filter((ch) =>
      validChannels.includes(ch as EventChannel)
    );

    if (validRequestedChannels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid channels specified',
        validChannels,
      });
    }

    // Get since timestamp
    const since = req.query.since ? parseInt(req.query.since as string) : undefined;

    // Get recent events
    const events = eventService.getRecentEvents(validRequestedChannels, since);

    return res.json({
      success: true,
      events,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to poll events', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to poll events',
    });
  }
});

/**
 * Get event service metrics
 * GET /api/events/metrics
 */
router.get('/metrics', (_req: Request, res: Response) => {
  try {
    const eventService = getEventService();
    const metrics = eventService.getMetrics();

    return res.json({
      success: true,
      metrics: {
        activeConnections: metrics.activeConnections,
        totalConnections: metrics.totalConnections,
        totalEvents: metrics.totalEvents,
        eventsByChannel: metrics.eventsByChannel,
        channelSubscribers: Object.fromEntries(
          Object.entries(metrics.connectionsByChannel).map(([k, v]) => [k, v.size])
        ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Event service not initialized',
    });
  }
});

/**
 * Get available channels
 * GET /api/events/channels
 */
router.get('/channels', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    channels: Object.values(EventChannel),
    description: {
      [EventChannel.TREASURY_DEPOSIT]: 'New deposits to the treasury',
      [EventChannel.TREASURY_BALANCE]: 'Treasury balance updates',
      [EventChannel.REIMBURSEMENTS_NEW]: 'New reimbursement requests',
      [EventChannel.REIMBURSEMENTS_APPROVED]: 'Reimbursement approvals',
      [EventChannel.REIMBURSEMENTS_PAID]: 'Reimbursement payments',
      [EventChannel.ELECTIONS_VOTE]: 'New election votes',
      [EventChannel.ELECTIONS_FINALIZED]: 'Election results',
      [EventChannel.PROPOSALS_NEW]: 'New proposals',
      [EventChannel.PROPOSALS_VOTE]: 'Proposal votes',
      [EventChannel.PROPOSALS_FINALIZED]: 'Proposal results',
    },
  });
});

export default router;
