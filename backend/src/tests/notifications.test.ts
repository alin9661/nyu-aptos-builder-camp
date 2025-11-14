import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { NotificationService, WalletNotification, InAppNotification } from '../services/notificationService';
import { EmailService } from '../services/emailService';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../utils/logger');
jest.mock('../services/emailService');

describe('NotificationService', () => {
  const mockUserAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockEmail = 'test@nyu.edu';
  const mockWalletAddress = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWalletCreatedEmail', () => {
    test('should send wallet created email with correct data', async () => {
      const notification: WalletNotification = {
        userAddress: mockUserAddress,
        email: mockEmail,
        firstName: 'John',
        lastName: 'Doe',
        walletAddress: mockWalletAddress,
        network: 'testnet',
        createdAt: new Date(),
      };

      // Mock shouldSendNotification to return true
      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(true);
      jest.spyOn(NotificationService as any, 'isValidEmail').mockReturnValue(true);
      jest.spyOn(NotificationService as any, 'checkEmailRateLimit').mockResolvedValue(true);
      jest.spyOn(NotificationService as any, 'updateLastEmailSent').mockResolvedValue(undefined);

      const mockEmailService = EmailService.prototype;
      jest.spyOn(mockEmailService, 'sendWalletCreatedEmail').mockResolvedValue(undefined);

      await NotificationService.sendWalletCreatedEmail(notification);

      expect(mockEmailService.sendWalletCreatedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockEmail,
          displayName: 'John Doe',
          walletAddress: mockWalletAddress,
          network: 'testnet',
        })
      );
    });

    test('should not send email if user preferences disable it', async () => {
      const notification: WalletNotification = {
        userAddress: mockUserAddress,
        email: mockEmail,
        walletAddress: mockWalletAddress,
        network: 'testnet',
        createdAt: new Date(),
      };

      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(false);

      const mockEmailService = EmailService.prototype;
      jest.spyOn(mockEmailService, 'sendWalletCreatedEmail').mockResolvedValue(undefined);

      await NotificationService.sendWalletCreatedEmail(notification);

      expect(mockEmailService.sendWalletCreatedEmail).not.toHaveBeenCalled();
    });

    test('should not send email if email is invalid', async () => {
      const notification: WalletNotification = {
        userAddress: mockUserAddress,
        email: 'invalid-email',
        walletAddress: mockWalletAddress,
        network: 'testnet',
        createdAt: new Date(),
      };

      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(true);
      jest.spyOn(NotificationService as any, 'isValidEmail').mockReturnValue(false);

      const mockEmailService = EmailService.prototype;
      jest.spyOn(mockEmailService, 'sendWalletCreatedEmail').mockResolvedValue(undefined);

      await NotificationService.sendWalletCreatedEmail(notification);

      expect(mockEmailService.sendWalletCreatedEmail).not.toHaveBeenCalled();
    });

    test('should not send email if rate limit is exceeded', async () => {
      const notification: WalletNotification = {
        userAddress: mockUserAddress,
        email: mockEmail,
        walletAddress: mockWalletAddress,
        network: 'testnet',
        createdAt: new Date(),
      };

      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(true);
      jest.spyOn(NotificationService as any, 'isValidEmail').mockReturnValue(true);
      jest.spyOn(NotificationService as any, 'checkEmailRateLimit').mockResolvedValue(false);

      const mockEmailService = EmailService.prototype;
      jest.spyOn(mockEmailService, 'sendWalletCreatedEmail').mockResolvedValue(undefined);

      await NotificationService.sendWalletCreatedEmail(notification);

      expect(mockEmailService.sendWalletCreatedEmail).not.toHaveBeenCalled();
    });
  });

  describe('createInAppNotification', () => {
    test('should create in-app notification with all fields', async () => {
      const notification: InAppNotification = {
        notificationType: 'wallet_created',
        title: 'Wallet Created',
        message: 'Your Aptos wallet has been created successfully',
        category: 'wallet',
        priority: 'high',
        actionUrl: '/wallet',
        actionLabel: 'View Wallet',
        metadata: { test: true },
      };

      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(true);

      await NotificationService.createInAppNotification(mockUserAddress, notification);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_notifications'),
        expect.arrayContaining([
          mockUserAddress,
          'wallet_created',
          'Wallet Created',
          'Your Aptos wallet has been created successfully',
          'wallet',
          'high',
          '/wallet',
          'View Wallet',
          JSON.stringify({ test: true }),
          null,
        ])
      );
    });

    test('should not create notification if user preferences disable it', async () => {
      const notification: InAppNotification = {
        notificationType: 'wallet_created',
        title: 'Wallet Created',
        message: 'Test message',
        category: 'wallet',
        priority: 'normal',
      };

      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      jest.spyOn(NotificationService as any, 'shouldSendNotification').mockResolvedValue(false);

      await NotificationService.createInAppNotification(mockUserAddress, notification);

      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    test('should mark notification as read', async () => {
      const notificationId = 123;
      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      await NotificationService.markAsRead(notificationId, mockUserAddress);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notifications'),
        [notificationId, mockUserAddress]
      );
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read for user', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      await NotificationService.markAllAsRead(mockUserAddress);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_notifications'),
        [mockUserAddress]
      );
    });
  });

  describe('getUnreadCount', () => {
    test('should return unread notification count', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([{ count: '5' }]);

      const count = await NotificationService.getUnreadCount(mockUserAddress);

      expect(count).toBe(5);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT'),
        [mockUserAddress]
      );
    });

    test('should return 0 if no unread notifications', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([{ count: '0' }]);

      const count = await NotificationService.getUnreadCount(mockUserAddress);

      expect(count).toBe(0);
    });

    test('should return 0 on error', async () => {
      const { query } = require('../config/database');
      query.mockRejectedValue(new Error('Database error'));

      const count = await NotificationService.getUnreadCount(mockUserAddress);

      expect(count).toBe(0);
    });
  });

  describe('getUserNotifications', () => {
    test('should return user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 1,
          notification_type: 'wallet_created',
          title: 'Test',
          message: 'Test message',
          category: 'wallet',
          priority: 'normal',
          read: false,
          created_at: new Date(),
        },
      ];

      const { query } = require('../config/database');
      query.mockResolvedValue(mockNotifications);

      const notifications = await NotificationService.getUserNotifications(
        mockUserAddress,
        10,
        0
      );

      expect(notifications).toEqual(mockNotifications);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockUserAddress, 10, 0]
      );
    });

    test('should return empty array on error', async () => {
      const { query } = require('../config/database');
      query.mockRejectedValue(new Error('Database error'));

      const notifications = await NotificationService.getUserNotifications(mockUserAddress);

      expect(notifications).toEqual([]);
    });
  });

  describe('deleteNotification', () => {
    test('should delete notification', async () => {
      const notificationId = 123;
      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      await NotificationService.deleteNotification(notificationId, mockUserAddress);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_notifications'),
        [notificationId, mockUserAddress]
      );
    });
  });

  describe('queueNotification', () => {
    test('should add notification to queue', async () => {
      const notification: WalletNotification = {
        userAddress: mockUserAddress,
        email: mockEmail,
        walletAddress: mockWalletAddress,
        network: 'testnet',
        createdAt: new Date(),
      };

      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      await NotificationService.queueNotification(notification);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_queue'),
        [JSON.stringify(notification)]
      );
    });
  });

  describe('getUserPreferences', () => {
    test('should return user notification preferences', async () => {
      const mockPreferences = {
        email: true,
        inApp: true,
        security: true,
        education: false,
      };

      const { query } = require('../config/database');
      query.mockResolvedValue([{ notification_preferences: mockPreferences }]);

      const preferences = await NotificationService.getUserPreferences(mockUserAddress);

      expect(preferences).toEqual(mockPreferences);
    });

    test('should return default preferences if user not found', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      const preferences = await NotificationService.getUserPreferences(mockUserAddress);

      expect(preferences).toEqual({
        email: true,
        inApp: true,
        security: true,
        education: true,
      });
    });

    test('should return default preferences on error', async () => {
      const { query } = require('../config/database');
      query.mockRejectedValue(new Error('Database error'));

      const preferences = await NotificationService.getUserPreferences(mockUserAddress);

      expect(preferences).toEqual({
        email: true,
        inApp: true,
        security: true,
        education: true,
      });
    });
  });

  describe('shouldSendNotification', () => {
    test('should return true if category preference is enabled', async () => {
      jest.spyOn(NotificationService, 'getUserPreferences').mockResolvedValue({
        email: true,
        inApp: true,
        security: true,
        education: true,
      });

      const should = await NotificationService.shouldSendNotification(mockUserAddress, 'email');

      expect(should).toBe(true);
    });

    test('should return false if category preference is disabled', async () => {
      jest.spyOn(NotificationService, 'getUserPreferences').mockResolvedValue({
        email: false,
        inApp: true,
        security: true,
        education: true,
      });

      const should = await NotificationService.shouldSendNotification(mockUserAddress, 'email');

      expect(should).toBe(false);
    });

    test('should return true for unknown categories', async () => {
      jest.spyOn(NotificationService, 'getUserPreferences').mockResolvedValue({
        email: true,
        inApp: true,
        security: true,
        education: true,
      });

      const should = await NotificationService.shouldSendNotification(
        mockUserAddress,
        'unknownCategory'
      );

      expect(should).toBe(true);
    });

    test('should return true on error', async () => {
      jest
        .spyOn(NotificationService, 'getUserPreferences')
        .mockRejectedValue(new Error('Error'));

      const should = await NotificationService.shouldSendNotification(mockUserAddress, 'email');

      expect(should).toBe(true);
    });
  });

  describe('createWalletCreatedNotification', () => {
    test('should create wallet created notification', async () => {
      jest.spyOn(NotificationService, 'createInAppNotification').mockResolvedValue(undefined);

      await NotificationService.createWalletCreatedNotification(
        mockUserAddress,
        mockWalletAddress
      );

      expect(NotificationService.createInAppNotification).toHaveBeenCalledWith(
        mockUserAddress,
        expect.objectContaining({
          notificationType: 'wallet_created',
          category: 'wallet',
          priority: 'high',
        })
      );
    });
  });

  describe('createWalletFundedNotification', () => {
    test('should create wallet funded notification', async () => {
      const txHash = '0xabcdef123456';
      const amount = '1.5';

      jest.spyOn(NotificationService, 'createInAppNotification').mockResolvedValue(undefined);

      await NotificationService.createWalletFundedNotification(
        mockUserAddress,
        mockWalletAddress,
        amount,
        txHash
      );

      expect(NotificationService.createInAppNotification).toHaveBeenCalledWith(
        mockUserAddress,
        expect.objectContaining({
          notificationType: 'wallet_funded',
          category: 'wallet',
          priority: 'normal',
          metadata: expect.objectContaining({
            amount,
            txHash,
          }),
        })
      );
    });
  });

  describe('Email validation', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@nyu.edu',
        'john.doe@example.com',
        'user+tag@domain.co.uk',
        'firstname.lastname@university.edu',
      ];

      validEmails.forEach((email) => {
        const isValid = (NotificationService as any).isValidEmail(email);
        expect(isValid).toBe(true);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid @email.com',
        'invalid@email',
        '',
        'invalid..email@test.com',
      ];

      invalidEmails.forEach((email) => {
        const isValid = (NotificationService as any).isValidEmail(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Rate limiting', () => {
    test('should allow email if rate limit not exceeded', async () => {
      const { query } = require('../config/database');
      const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      query.mockResolvedValue([{ last_email_sent_at: pastDate }]);

      const allowed = await (NotificationService as any).checkEmailRateLimit(mockUserAddress);

      expect(allowed).toBe(true);
    });

    test('should block email if rate limit exceeded', async () => {
      const { query } = require('../config/database');
      const recentDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      query.mockResolvedValue([{ last_email_sent_at: recentDate }]);

      const allowed = await (NotificationService as any).checkEmailRateLimit(mockUserAddress);

      expect(allowed).toBe(false);
    });

    test('should allow email if no previous email sent', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([{ last_email_sent_at: null }]);

      const allowed = await (NotificationService as any).checkEmailRateLimit(mockUserAddress);

      expect(allowed).toBe(true);
    });

    test('should allow email if user not found', async () => {
      const { query } = require('../config/database');
      query.mockResolvedValue([]);

      const allowed = await (NotificationService as any).checkEmailRateLimit(mockUserAddress);

      expect(allowed).toBe(true);
    });
  });
});
