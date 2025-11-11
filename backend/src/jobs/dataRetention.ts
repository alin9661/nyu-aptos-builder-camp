import { ComplianceService } from '../services/complianceService';
import { MonitoringService } from '../services/monitoringService';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import cron from 'node-cron';

/**
 * Data retention job configuration
 */
interface RetentionJobConfig {
  enabled: boolean;
  cronSchedule: string; // Default: '0 2 * * *' (2 AM daily)
  retentionDays: number; // Default: 730 (2 years)
  archiveEnabled: boolean;
  deleteExpiredExports: boolean;
}

/**
 * Retention job statistics
 */
interface RetentionJobStats {
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  recordsAnonymized: number;
  recordsArchived: number;
  recordsDeleted: number;
  exportsDeleted: number;
  errors: string[];
}

/**
 * DataRetentionJob - Automated data retention and cleanup
 *
 * Runs daily to:
 * - Anonymize audit logs older than 2 years
 * - Archive old logs to cold storage
 * - Delete data for users who revoked consent
 * - Clean up expired data exports
 * - Generate retention reports
 */
export class DataRetentionJob {
  private static config: RetentionJobConfig = {
    enabled: true,
    cronSchedule: '0 2 * * *', // 2 AM daily
    retentionDays: 730, // 2 years
    archiveEnabled: false, // Archiving disabled by default
    deleteExpiredExports: true,
  };

  private static isRunning = false;
  private static lastRun?: Date;
  private static lastStats?: RetentionJobStats;
  private static cronJob?: cron.ScheduledTask;

  /**
   * Initialize and start the cron job
   */
  static initialize(): void {
    if (!this.config.enabled) {
      logger.info('Data retention job is disabled');
      return;
    }

    // Validate cron schedule
    if (!cron.validate(this.config.cronSchedule)) {
      logger.error('Invalid cron schedule', { schedule: this.config.cronSchedule });
      return;
    }

    // Schedule the job
    this.cronJob = cron.schedule(this.config.cronSchedule, async () => {
      await this.run();
    });

    logger.info('Data retention job initialized', {
      schedule: this.config.cronSchedule,
      retentionDays: this.config.retentionDays,
    });
  }

  /**
   * Stop the cron job
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Data retention job stopped');
    }
  }

  /**
   * Run the data retention job manually
   */
  static async run(): Promise<RetentionJobStats> {
    if (this.isRunning) {
      logger.warn('Data retention job already running');
      throw new Error('Job already running');
    }

    this.isRunning = true;
    const jobId = `retention-${Date.now()}`;
    const stats: RetentionJobStats = {
      jobId,
      startTime: new Date(),
      status: 'running',
      recordsAnonymized: 0,
      recordsArchived: 0,
      recordsDeleted: 0,
      exportsDeleted: 0,
      errors: [],
    };

    logger.info('Data retention job started', { jobId });

    try {
      // 1. Anonymize old audit logs
      logger.info('Anonymizing old audit logs');
      stats.recordsAnonymized = await this.anonymizeOldAuditLogs();
      logger.info('Audit logs anonymized', { count: stats.recordsAnonymized });

      // 2. Archive old records (if enabled)
      if (this.config.archiveEnabled) {
        logger.info('Archiving old records');
        stats.recordsArchived = await this.archiveOldRecords();
        logger.info('Records archived', { count: stats.recordsArchived });
      }

      // 3. Process consent revocations
      logger.info('Processing consent revocations');
      const deletedCount = await this.processConsentRevocations();
      stats.recordsDeleted = deletedCount;
      logger.info('Consent revocations processed', { count: deletedCount });

      // 4. Clean up expired data exports
      if (this.config.deleteExpiredExports) {
        logger.info('Cleaning up expired data exports');
        stats.exportsDeleted = await this.cleanupExpiredExports();
        logger.info('Expired exports deleted', { count: stats.exportsDeleted });
      }

      // 5. Clean up old security alerts
      logger.info('Cleaning up old security alerts');
      await this.cleanupOldSecurityAlerts();

      // 6. Generate retention report
      await this.generateRetentionReport(stats);

      stats.endTime = new Date();
      stats.status = 'completed';
      this.lastStats = stats;
      this.lastRun = new Date();

      logger.info('Data retention job completed', {
        jobId,
        duration: stats.endTime.getTime() - stats.startTime.getTime(),
        stats,
      });
    } catch (error) {
      stats.status = 'failed';
      stats.endTime = new Date();
      stats.errors.push(error instanceof Error ? error.message : 'Unknown error');

      logger.error('Data retention job failed', { error, jobId, stats });

      // Create alert for job failure
      await MonitoringService.createAlert({
        alertType: 'data_retention_job_failure',
        severity: 'high' as any,
        description: `Data retention job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { jobId, stats },
        status: 'new' as any,
        triggeredAt: new Date(),
      });
    } finally {
      this.isRunning = false;
    }

    return stats;
  }

  /**
   * Anonymize audit logs older than retention period
   */
  private static async anonymizeOldAuditLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const result = await query<any>(
        `WITH updated AS (
          UPDATE wallet_audit_logs
          SET user_address = 'ANONYMIZED',
              sso_id = NULL,
              ip_address = NULL,
              user_agent = NULL,
              metadata = jsonb_set(
                COALESCE(metadata, '{}'),
                '{anonymized}',
                to_jsonb(NOW()::text)
              )
          WHERE created_at < $1
            AND user_address IS NOT NULL
            AND user_address NOT IN ('ANONYMIZED', 'DELETED')
          RETURNING id
        )
        SELECT COUNT(*) as count FROM updated`,
        [cutoffDate]
      );

      return parseInt(result[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to anonymize old audit logs', { error });
      throw error;
    }
  }

  /**
   * Archive old records to cold storage
   * Placeholder for archiving functionality
   */
  private static async archiveOldRecords(): Promise<number> {
    try {
      // TODO: Implement archiving to cold storage (S3, etc.)
      // For now, just count records that would be archived
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const result = await query<any>(
        `SELECT COUNT(*) as count
         FROM wallet_audit_logs
         WHERE created_at < $1
           AND user_address = 'ANONYMIZED'`,
        [cutoffDate]
      );

      logger.info('Archive feature not yet implemented', {
        recordsToArchive: result[0]?.count || 0,
      });

      return 0; // Return 0 until archiving is implemented
    } catch (error) {
      logger.error('Failed to archive old records', { error });
      throw error;
    }
  }

  /**
   * Process consent revocations and delete data
   */
  private static async processConsentRevocations(): Promise<number> {
    try {
      // Find users who revoked critical consents more than 30 days ago (grace period)
      const gracePeriodDate = new Date();
      gracePeriodDate.setDate(gracePeriodDate.getDate() - 30);

      const revokedUsers = await query<any>(
        `SELECT DISTINCT user_address
         FROM user_consents
         WHERE consent_type IN ('data_processing', 'private_key_storage')
           AND granted = false
           AND revoked_at < $1
           AND revoked_at IS NOT NULL`,
        [gracePeriodDate]
      );

      let deletedCount = 0;

      for (const row of revokedUsers) {
        try {
          // Check if there are any active consents
          const activeConsents = await query<any>(
            `SELECT COUNT(*) as count
             FROM user_consents
             WHERE user_address = $1 AND granted = true`,
            [row.user_address]
          );

          // Only delete if no active consents
          if (parseInt(activeConsents[0]?.count || '0') === 0) {
            await ComplianceService.deleteUserData(
              row.user_address,
              'user_initiated',
              false
            );
            deletedCount++;
          }
        } catch (error) {
          logger.error('Failed to delete user data after consent revocation', {
            error,
            userAddress: row.user_address,
          });
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to process consent revocations', { error });
      throw error;
    }
  }

  /**
   * Clean up expired data exports
   */
  private static async cleanupExpiredExports(): Promise<number> {
    try {
      const result = await query<any>(
        `WITH deleted AS (
          DELETE FROM data_export_requests
          WHERE expires_at < NOW()
            AND status = 'completed'
          RETURNING id
        )
        SELECT COUNT(*) as count FROM deleted`
      );

      return parseInt(result[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to cleanup expired exports', { error });
      throw error;
    }
  }

  /**
   * Clean up old resolved security alerts
   */
  private static async cleanupOldSecurityAlerts(): Promise<number> {
    try {
      // Keep alerts for 1 year
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      const result = await query<any>(
        `WITH deleted AS (
          DELETE FROM security_alerts
          WHERE status IN ('resolved', 'false_positive')
            AND resolved_at < $1
          RETURNING id
        )
        SELECT COUNT(*) as count FROM deleted`,
        [cutoffDate]
      );

      const deletedCount = parseInt(result[0]?.count || '0');

      if (deletedCount > 0) {
        logger.info('Old security alerts cleaned up', { count: deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old security alerts', { error });
      throw error;
    }
  }

  /**
   * Generate retention report
   */
  private static async generateRetentionReport(stats: RetentionJobStats): Promise<void> {
    try {
      // Store report in compliance_events table
      await query(
        `INSERT INTO compliance_events (
          event_type, description, metadata, compliance_officer
        ) VALUES ($1, $2, $3, $4)`,
        [
          'data_retention_execution',
          `Data retention job completed: ${stats.recordsAnonymized} records anonymized, ${stats.recordsDeleted} users deleted`,
          JSON.stringify({
            jobId: stats.jobId,
            stats,
            retentionDays: this.config.retentionDays,
          }),
          'system',
        ]
      );

      logger.info('Retention report generated', { jobId: stats.jobId });
    } catch (error) {
      logger.error('Failed to generate retention report', { error });
    }
  }

  /**
   * Get last run statistics
   */
  static getLastStats(): RetentionJobStats | undefined {
    return this.lastStats;
  }

  /**
   * Get last run time
   */
  static getLastRunTime(): Date | undefined {
    return this.lastRun;
  }

  /**
   * Check if job is currently running
   */
  static getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update job configuration
   */
  static updateConfig(config: Partial<RetentionJobConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart cron job if schedule changed
    if (config.cronSchedule && this.cronJob) {
      this.stop();
      this.initialize();
    }

    logger.info('Data retention job configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  static getConfig(): RetentionJobConfig {
    return { ...this.config };
  }

  /**
   * Get retention job status
   */
  static getStatus(): {
    enabled: boolean;
    isRunning: boolean;
    lastRun?: Date;
    nextRun?: Date;
    lastStats?: RetentionJobStats;
    config: RetentionJobConfig;
  } {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.cronJob ? new Date() : undefined, // TODO: Calculate next run time
      lastStats: this.lastStats,
      config: this.config,
    };
  }
}

// Export convenience functions
export const startDataRetentionJob = (): void => {
  DataRetentionJob.initialize();
};

export const stopDataRetentionJob = (): void => {
  DataRetentionJob.stop();
};

export const runDataRetentionJobNow = async (): Promise<RetentionJobStats> => {
  return await DataRetentionJob.run();
};

export const getDataRetentionJobStatus = () => {
  return DataRetentionJob.getStatus();
};
