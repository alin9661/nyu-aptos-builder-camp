import { query } from '../config/database';
import { logger } from '../utils/logger';
import { EmailService } from './emailService';

/**
 * Wallet notification data
 */
export interface WalletNotification {
  userAddress: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletAddress: string;
  network: 'testnet' | 'mainnet';
  createdAt: Date;
}

/**
 * In-app notification data
 */
export interface InAppNotification {
  notificationType: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  security: boolean;
  education: boolean;
}

/**
 * Notification queue item
 */
interface QueuedNotification {
  id: number;
  notificationData: WalletNotification;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
}

/**
 * Service for managing user notifications
 */
export class NotificationService {
  private static emailService = new EmailService();

  /**
   * Send wallet created email
   */
  static async sendWalletCreatedEmail(notification: WalletNotification): Promise<void> {
    try {
      // Check if user wants email notifications
      if (!(await this.shouldSendNotification(notification.userAddress, 'email'))) {
        logger.info('Email notification skipped due to user preferences', {
          userAddress: notification.userAddress,
        });
        return;
      }

      // Validate email
      if (!this.isValidEmail(notification.email)) {
        logger.warn('Invalid email address', { email: notification.email });
        return;
      }

      // Check rate limit
      if (!(await this.checkEmailRateLimit(notification.userAddress))) {
        logger.warn('Email rate limit exceeded', { userAddress: notification.userAddress });
        return;
      }

      const displayName = notification.firstName && notification.lastName
        ? `${notification.firstName} ${notification.lastName}`
        : notification.email.split('@')[0];

      await this.emailService.sendWalletCreatedEmail({
        to: notification.email,
        displayName,
        walletAddress: notification.walletAddress,
        network: notification.network,
      });

      // Update last email sent timestamp
      await this.updateLastEmailSent(notification.userAddress);

      logger.info('Wallet created email sent', {
        email: notification.email,
        walletAddress: notification.walletAddress,
      });
    } catch (error) {
      logger.error('Failed to send wallet created email', { error, notification });
      throw error;
    }
  }

  /**
   * Send wallet education email
   */
  static async sendWalletEducationEmail(email: string, walletAddress: string): Promise<void> {
    try {
      if (!this.isValidEmail(email)) {
        logger.warn('Invalid email address', { email });
        return;
      }

      await this.emailService.sendWalletEducationEmail({
        to: email,
        walletAddress,
      });

      logger.info('Wallet education email sent', { email, walletAddress });
    } catch (error) {
      logger.error('Failed to send wallet education email', { error, email });
      throw error;
    }
  }

  /**
   * Send wallet funded email
   */
  static async sendWalletFundedEmail(
    email: string,
    walletAddress: string,
    amount: string,
    txHash: string
  ): Promise<void> {
    try {
      if (!this.isValidEmail(email)) {
        logger.warn('Invalid email address', { email });
        return;
      }

      await this.emailService.sendWalletFundedEmail({
        to: email,
        walletAddress,
        amount,
        txHash,
      });

      logger.info('Wallet funded email sent', { email, walletAddress, amount });
    } catch (error) {
      logger.error('Failed to send wallet funded email', { error, email });
      throw error;
    }
  }

  /**
   * Create in-app notification
   */
  static async createInAppNotification(
    userAddress: string,
    notification: InAppNotification
  ): Promise<void> {
    try {
      // Check if user wants in-app notifications
      if (!(await this.shouldSendNotification(userAddress, 'inApp'))) {
        logger.info('In-app notification skipped due to user preferences', { userAddress });
        return;
      }

      await query(
        `INSERT INTO user_notifications (
          user_address,
          notification_type,
          title,
          message,
          category,
          priority,
          action_url,
          action_label,
          metadata,
          expires_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          userAddress,
          notification.notificationType,
          notification.title,
          notification.message,
          notification.category,
          notification.priority,
          notification.actionUrl || null,
          notification.actionLabel || null,
          notification.metadata ? JSON.stringify(notification.metadata) : null,
          notification.expiresAt || null,
        ]
      );

      logger.info('In-app notification created', {
        userAddress,
        type: notification.notificationType,
      });
    } catch (error) {
      logger.error('Failed to create in-app notification', { error, userAddress });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userAddress: string): Promise<void> {
    try {
      await query(
        `UPDATE user_notifications
         SET read = true, read_at = NOW()
         WHERE id = $1 AND user_address = $2 AND read = false`,
        [notificationId, userAddress]
      );

      logger.info('Notification marked as read', { notificationId, userAddress });
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userAddress: string): Promise<void> {
    try {
      await query(
        `UPDATE user_notifications
         SET read = true, read_at = NOW()
         WHERE user_address = $1 AND read = false`,
        [userAddress]
      );

      logger.info('All notifications marked as read', { userAddress });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userAddress });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userAddress: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count
         FROM user_notifications
         WHERE user_address = $1 AND read = false
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [userAddress]
      );

      return parseInt(result[0]?.count || '0', 10);
    } catch (error) {
      logger.error('Failed to get unread count', { error, userAddress });
      return 0;
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userAddress: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const notifications = await query(
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
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userAddress, limit, offset]
      );

      return notifications;
    } catch (error) {
      logger.error('Failed to get user notifications', { error, userAddress });
      return [];
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: number, userAddress: string): Promise<void> {
    try {
      await query(
        `DELETE FROM user_notifications
         WHERE id = $1 AND user_address = $2`,
        [notificationId, userAddress]
      );

      logger.info('Notification deleted', { notificationId, userAddress });
    } catch (error) {
      logger.error('Failed to delete notification', { error, notificationId });
      throw error;
    }
  }

  /**
   * Queue notification for processing
   */
  static async queueNotification(notification: WalletNotification): Promise<void> {
    try {
      await query(
        `INSERT INTO notification_queue (
          notification_data,
          status,
          retry_count,
          created_at
        ) VALUES ($1, 'pending', 0, NOW())`,
        [JSON.stringify(notification)]
      );

      logger.info('Notification queued', { walletAddress: notification.walletAddress });
    } catch (error) {
      logger.error('Failed to queue notification', { error, notification });
      throw error;
    }
  }

  /**
   * Process notification queue
   */
  static async processNotificationQueue(): Promise<void> {
    try {
      // Get pending notifications
      const pendingNotifications = await query(
        `SELECT id, notification_data, retry_count
         FROM notification_queue
         WHERE status = 'pending' AND retry_count < 3
         ORDER BY created_at ASC
         LIMIT 10`
      );

      for (const item of pendingNotifications) {
        try {
          // Mark as processing
          await query(
            `UPDATE notification_queue SET status = 'processing' WHERE id = $1`,
            [item.id]
          );

          const notification: WalletNotification = JSON.parse(item.notification_data);

          // Send notification
          await this.sendWalletCreatedEmail(notification);

          // Mark as completed
          await query(
            `UPDATE notification_queue SET status = 'completed', processed_at = NOW() WHERE id = $1`,
            [item.id]
          );

          logger.info('Notification processed successfully', { id: item.id });
        } catch (error) {
          // Increment retry count
          const retryCount = item.retry_count + 1;
          const status = retryCount >= 3 ? 'failed' : 'pending';

          await query(
            `UPDATE notification_queue
             SET status = $1, retry_count = $2, last_error = $3, updated_at = NOW()
             WHERE id = $4`,
            [status, retryCount, (error as Error).message, item.id]
          );

          logger.error('Failed to process notification', {
            id: item.id,
            retryCount,
            error,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process notification queue', { error });
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userAddress: string): Promise<NotificationPreferences> {
    try {
      const result = await query(
        `SELECT notification_preferences FROM users WHERE address = $1`,
        [userAddress]
      );

      if (result.length === 0) {
        return { email: true, inApp: true, security: true, education: true };
      }

      const prefs = result[0].notification_preferences;
      return prefs || { email: true, inApp: true, security: true, education: true };
    } catch (error) {
      logger.error('Failed to get user preferences', { error, userAddress });
      return { email: true, inApp: true, security: true, education: true };
    }
  }

  /**
   * Check if notification should be sent
   */
  static async shouldSendNotification(
    userAddress: string,
    category: string
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userAddress);

      // Check category-specific preference
      if (category in preferences) {
        return preferences[category as keyof NotificationPreferences];
      }

      return true;
    } catch (error) {
      logger.error('Failed to check notification preferences', { error, userAddress });
      return true; // Default to sending
    }
  }

  /**
   * Create wallet created notification
   */
  static async createWalletCreatedNotification(
    userAddress: string,
    walletAddress: string
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.createInAppNotification(userAddress, {
        notificationType: 'wallet_created',
        title: 'Welcome! Your Aptos Wallet is Ready',
        message: `Your Aptos wallet has been created successfully. Address: ${walletAddress.substring(0, 10)}...`,
        category: 'wallet',
        priority: 'high',
        actionUrl: '/wallet',
        actionLabel: 'View Wallet',
        metadata: { walletAddress },
      });

      logger.info('Wallet created notification sent', { userAddress, walletAddress });
    } catch (error) {
      logger.error('Failed to create wallet created notification', { error, userAddress });
      throw error;
    }
  }

  /**
   * Create wallet funded notification
   */
  static async createWalletFundedNotification(
    userAddress: string,
    walletAddress: string,
    amount: string,
    txHash: string
  ): Promise<void> {
    try {
      const network = process.env.APTOS_NETWORK || 'testnet';
      const explorerUrl = `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;

      // Create in-app notification
      await this.createInAppNotification(userAddress, {
        notificationType: 'wallet_funded',
        title: 'Wallet Funded Successfully',
        message: `Your wallet has been funded with ${amount} APT. Transaction: ${txHash.substring(0, 10)}...`,
        category: 'wallet',
        priority: 'normal',
        actionUrl: explorerUrl,
        actionLabel: 'View Transaction',
        metadata: { walletAddress, amount, txHash },
      });

      logger.info('Wallet funded notification sent', { userAddress, amount, txHash });
    } catch (error) {
      logger.error('Failed to create wallet funded notification', { error, userAddress });
      throw error;
    }
  }

  /**
   * Check email rate limit (max 1 email per 5 minutes per user)
   */
  private static async checkEmailRateLimit(userAddress: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT last_email_sent_at FROM users WHERE address = $1`,
        [userAddress]
      );

      if (result.length === 0) return true;

      const lastSent = result[0].last_email_sent_at;
      if (!lastSent) return true;

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return new Date(lastSent) < fiveMinutesAgo;
    } catch (error) {
      logger.error('Failed to check email rate limit', { error, userAddress });
      return true; // Allow on error
    }
  }

  /**
   * Update last email sent timestamp
   */
  private static async updateLastEmailSent(userAddress: string): Promise<void> {
    try {
      await query(
        `UPDATE users SET last_email_sent_at = NOW() WHERE address = $1`,
        [userAddress]
      );
    } catch (error) {
      logger.error('Failed to update last email sent', { error, userAddress });
    }
  }

  /**
   * Validate email address
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
