import express, { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
import { query } from '../config/database';

const router = express.Router();

/**
 * Authentication middleware
 * Should verify JWT token and extract user address
 */
const authenticateUser = async (req: Request, res: Response, next: Function) => {
  try {
    // TODO: Implement JWT verification
    // For now, expect address in header
    const userAddress = req.headers['x-user-address'] as string;

    if (!userAddress) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user exists
    const users = await query('SELECT address FROM users WHERE address = $1', [userAddress]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.body.userAddress = userAddress;
    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * GET /api/notifications
 * Get user notifications with pagination
 */
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string;

    let notifications;

    if (category) {
      // Filter by category
      notifications = await query(
        `SELECT
          id,
          notification_type,
          title,
          message,
          category,
          priority,
          read,
          read_at,
          action_url,
          action_label,
          metadata,
          created_at,
          expires_at
         FROM user_notifications
         WHERE user_address = $1
         AND category = $2
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [userAddress, category, limit, offset]
      );
    } else {
      notifications = await NotificationService.getUserNotifications(
        userAddress,
        limit,
        offset
      );
    }

    res.json({
      notifications,
      pagination: {
        limit,
        offset,
        total: notifications.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get notifications', { error });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const count = await NotificationService.getUnreadCount(userAddress);

    res.json({ count });
  } catch (error) {
    logger.error('Failed to get unread count', { error });
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await NotificationService.markAsRead(notificationId, userAddress);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Failed to mark notification as read', { error });
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;

    await NotificationService.markAllAsRead(userAddress);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error });
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await NotificationService.deleteNotification(notificationId, userAddress);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Failed to delete notification', { error });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;

    const preferences = await NotificationService.getUserPreferences(userAddress);

    res.json({ preferences });
  } catch (error) {
    logger.error('Failed to get preferences', { error });
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put('/preferences', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const { email, inApp, security, education } = req.body;

    // Validate preferences
    if (
      typeof email !== 'boolean' ||
      typeof inApp !== 'boolean' ||
      typeof security !== 'boolean' ||
      typeof education !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Invalid preferences format' });
    }

    const preferences = { email, inApp, security, education };

    await query(
      `UPDATE users SET notification_preferences = $1 WHERE address = $2`,
      [JSON.stringify(preferences), userAddress]
    );

    logger.info('Notification preferences updated', { userAddress, preferences });

    res.json({ success: true, message: 'Preferences updated', preferences });
  } catch (error) {
    logger.error('Failed to update preferences', { error });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/notifications/test
 * Send a test notification (development only)
 */
router.post('/test', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test endpoint not available in production' });
    }

    const { userAddress } = req.body;

    await NotificationService.createInAppNotification(userAddress, {
      notificationType: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      category: 'system',
      priority: 'normal',
      actionUrl: '/notifications',
      actionLabel: 'View Notifications',
      metadata: { test: true, timestamp: new Date().toISOString() },
    });

    res.json({ success: true, message: 'Test notification created' });
  } catch (error) {
    logger.error('Failed to create test notification', { error });
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

/**
 * GET /api/notifications/categories
 * Get available notification categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = [
      { value: 'wallet', label: 'Wallet', description: 'Wallet-related notifications' },
      { value: 'security', label: 'Security', description: 'Security alerts and tips' },
      { value: 'governance', label: 'Governance', description: 'Governance proposals and votes' },
      { value: 'reimbursement', label: 'Reimbursement', description: 'Reimbursement requests and approvals' },
      { value: 'treasury', label: 'Treasury', description: 'Treasury and financial updates' },
      { value: 'education', label: 'Education', description: 'Educational content and guides' },
      { value: 'system', label: 'System', description: 'System announcements and updates' },
    ];

    res.json({ categories });
  } catch (error) {
    logger.error('Failed to get categories', { error });
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
