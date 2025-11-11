import * as cron from 'node-cron';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

/**
 * Background worker for processing notification queue
 */
export class NotificationWorker {
  private static instance: NotificationWorker;
  private cronJob: cron.ScheduledTask | null = null;
  private isProcessing: boolean = false;
  private processedCount: number = 0;
  private errorCount: number = 0;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationWorker {
    if (!NotificationWorker.instance) {
      NotificationWorker.instance = new NotificationWorker();
    }
    return NotificationWorker.instance;
  }

  /**
   * Start the notification worker
   * Processes queue every 30 seconds
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Notification worker is already running');
      return;
    }

    logger.info('Starting notification worker');

    // Run every 30 seconds: */30 * * * * *
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      await this.processQueue();
    });

    // Also run immediately on start
    this.processQueue().catch((error) => {
      logger.error('Initial queue processing failed', { error });
    });

    logger.info('Notification worker started successfully');
  }

  /**
   * Stop the notification worker
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Notification worker stopped', {
        processedCount: this.processedCount,
        errorCount: this.errorCount,
      });
    }
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      logger.debug('Queue processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.debug('Processing notification queue');

      // Process the queue using NotificationService
      await NotificationService.processNotificationQueue();

      const duration = Date.now() - startTime;
      logger.debug('Queue processing completed', {
        duration: `${duration}ms`,
        totalProcessed: this.processedCount,
        totalErrors: this.errorCount,
      });
    } catch (error) {
      this.errorCount++;
      logger.error('Queue processing failed', { error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    isRunning: boolean;
    isProcessing: boolean;
    processedCount: number;
    errorCount: number;
  } {
    return {
      isRunning: this.cronJob !== null,
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * Manually trigger queue processing
   * Useful for testing or forcing immediate processing
   */
  async triggerProcessing(): Promise<void> {
    logger.info('Manually triggering queue processing');
    await this.processQueue();
  }
}

// Export singleton instance
export const notificationWorker = NotificationWorker.getInstance();

// Auto-start in production
if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_WORKERS === 'true') {
  notificationWorker.start();
  logger.info('Notification worker auto-started');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping notification worker');
  notificationWorker.stop();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, stopping notification worker');
  notificationWorker.stop();
});
