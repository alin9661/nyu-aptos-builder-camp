import { query } from '../config/database';
import { logger } from '../utils/logger';
import { AuditService, EventCategory, EventSeverity } from './auditService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Alert status
 */
export enum AlertStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
  id?: number;
  alertId: string;
  alertType: string;
  severity: AlertSeverity;
  userAddress?: string;
  description: string;
  metadata: Record<string, any>;
  status: AlertStatus;
  triggeredAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

/**
 * Monitoring threshold configuration
 */
interface MonitoringThresholds {
  walletAccessPerHour: number;
  failedWalletGenPerHour: number;
  failedAuthPerHour: number;
  dataExportsPerDay: number;
  consentRevocationsPerDay: number;
  suspiciousIpChanges: number;
}

/**
 * Notification channel
 */
export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'log';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * MonitoringService - Security monitoring and alerting
 *
 * Monitors for:
 * - Unusual wallet access patterns
 * - Failed authentication attempts
 * - Bulk data operations
 * - Suspicious consent patterns
 * - Geographic anomalies
 */
export class MonitoringService {
  private static thresholds: MonitoringThresholds = {
    walletAccessPerHour: 10,
    failedWalletGenPerHour: 5,
    failedAuthPerHour: 5,
    dataExportsPerDay: 3,
    consentRevocationsPerDay: 5,
    suspiciousIpChanges: 3,
  };

  private static notificationChannels: NotificationChannel[] = [
    { type: 'log', config: {}, enabled: true },
  ];

  /**
   * Create a security alert
   * @param alert - Alert details
   * @returns Alert ID
   */
  static async createAlert(alert: Omit<SecurityAlert, 'alertId'>): Promise<string> {
    try {
      const alertId = uuidv4();

      await query(
        `INSERT INTO security_alerts (
          alert_id, alert_type, severity, user_address, description,
          metadata, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          alertId,
          alert.alertType,
          alert.severity,
          alert.userAddress || null,
          alert.description,
          JSON.stringify(alert.metadata),
          alert.status || AlertStatus.NEW,
        ]
      );

      logger.warn('Security alert created', {
        alertId,
        alertType: alert.alertType,
        severity: alert.severity,
        userAddress: alert.userAddress,
      });

      // Send notifications
      await this.sendAlertNotifications({
        ...alert,
        alertId,
        triggeredAt: new Date(),
      });

      return alertId;
    } catch (error) {
      logger.error('Failed to create security alert', { error, alert });
      throw new Error('Failed to create security alert');
    }
  }

  /**
   * Monitor wallet access patterns
   * @param userAddress - User's wallet address
   */
  static async monitorWalletAccess(userAddress: string): Promise<void> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Count wallet access events in last hour
      const results = await query<any>(
        `SELECT COUNT(*) as access_count
         FROM wallet_audit_logs
         WHERE user_address = $1
           AND event_type IN ('wallet_accessed', 'wallet_generation_attempt')
           AND created_at >= $2`,
        [userAddress, oneHourAgo]
      );

      const accessCount = parseInt(results[0]?.access_count || '0');

      if (accessCount > this.thresholds.walletAccessPerHour) {
        await this.createAlert({
          alertType: 'high_wallet_access_frequency',
          severity: AlertSeverity.HIGH,
          userAddress,
          description: `User exceeded wallet access threshold: ${accessCount} accesses in 1 hour`,
          metadata: {
            accessCount,
            threshold: this.thresholds.walletAccessPerHour,
            timeWindow: '1 hour',
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor wallet access', { error, userAddress });
    }
  }

  /**
   * Monitor failed wallet generation attempts
   */
  static async monitorFailedWalletGeneration(): Promise<void> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const results = await query<any>(
        `SELECT user_address, COUNT(*) as failure_count
         FROM wallet_audit_logs
         WHERE event_type = 'wallet_generation_attempt'
           AND status = 'failure'
           AND created_at >= $1
         GROUP BY user_address
         HAVING COUNT(*) > $2`,
        [oneHourAgo, this.thresholds.failedWalletGenPerHour]
      );

      for (const row of results) {
        await this.createAlert({
          alertType: 'repeated_wallet_generation_failures',
          severity: AlertSeverity.MEDIUM,
          userAddress: row.user_address,
          description: `Multiple failed wallet generation attempts: ${row.failure_count} failures in 1 hour`,
          metadata: {
            failureCount: parseInt(row.failure_count),
            threshold: this.thresholds.failedWalletGenPerHour,
            timeWindow: '1 hour',
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor wallet generation', { error });
    }
  }

  /**
   * Monitor failed authentication attempts
   */
  static async monitorFailedAuthentication(): Promise<void> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const results = await query<any>(
        `SELECT sso_id, ip_address, COUNT(*) as failure_count
         FROM wallet_audit_logs
         WHERE event_type = 'authentication_failure'
           AND created_at >= $1
         GROUP BY sso_id, ip_address
         HAVING COUNT(*) > $2`,
        [oneHourAgo, this.thresholds.failedAuthPerHour]
      );

      for (const row of results) {
        await this.createAlert({
          alertType: 'repeated_authentication_failures',
          severity: AlertSeverity.HIGH,
          description: `Multiple failed authentication attempts: ${row.failure_count} failures in 1 hour`,
          metadata: {
            ssoId: row.sso_id,
            ipAddress: row.ip_address,
            failureCount: parseInt(row.failure_count),
            threshold: this.thresholds.failedAuthPerHour,
            timeWindow: '1 hour',
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor authentication', { error });
    }
  }

  /**
   * Monitor bulk data exports (potential breach)
   */
  static async monitorBulkDataExports(): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const results = await query<any>(
        `SELECT user_address, COUNT(*) as export_count
         FROM wallet_audit_logs
         WHERE event_type = 'data_exported'
           AND created_at >= $1
         GROUP BY user_address
         HAVING COUNT(*) > $2`,
        [oneDayAgo, this.thresholds.dataExportsPerDay]
      );

      for (const row of results) {
        await this.createAlert({
          alertType: 'bulk_data_exports',
          severity: AlertSeverity.CRITICAL,
          userAddress: row.user_address,
          description: `Unusual number of data exports: ${row.export_count} exports in 24 hours`,
          metadata: {
            exportCount: parseInt(row.export_count),
            threshold: this.thresholds.dataExportsPerDay,
            timeWindow: '24 hours',
            potentialBreach: true,
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor data exports', { error });
    }
  }

  /**
   * Monitor consent revocation trends
   */
  static async monitorConsentRevocations(): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const results = await query<any>(
        `SELECT user_address, COUNT(*) as revocation_count
         FROM wallet_audit_logs
         WHERE event_type = 'consent_revoked'
           AND created_at >= $1
         GROUP BY user_address
         HAVING COUNT(*) > $2`,
        [oneDayAgo, this.thresholds.consentRevocationsPerDay]
      );

      for (const row of results) {
        await this.createAlert({
          alertType: 'multiple_consent_revocations',
          severity: AlertSeverity.MEDIUM,
          userAddress: row.user_address,
          description: `Multiple consent revocations: ${row.revocation_count} revocations in 24 hours`,
          metadata: {
            revocationCount: parseInt(row.revocation_count),
            threshold: this.thresholds.consentRevocationsPerDay,
            timeWindow: '24 hours',
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor consent revocations', { error });
    }
  }

  /**
   * Monitor geographic anomalies (IP changes)
   * @param userAddress - User's wallet address
   * @param currentIp - Current IP address
   */
  static async monitorGeographicAnomaly(
    userAddress: string,
    currentIp: string
  ): Promise<void> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Get distinct IPs used in last hour
      const results = await query<any>(
        `SELECT DISTINCT ip_address, COUNT(*) as usage_count
         FROM wallet_audit_logs
         WHERE user_address = $1
           AND created_at >= $2
           AND ip_address IS NOT NULL
         GROUP BY ip_address`,
        [userAddress, oneHourAgo]
      );

      const distinctIps = results.length;

      if (distinctIps > this.thresholds.suspiciousIpChanges) {
        await this.createAlert({
          alertType: 'geographic_anomaly',
          severity: AlertSeverity.HIGH,
          userAddress,
          description: `Suspicious IP address changes: ${distinctIps} different IPs in 1 hour`,
          metadata: {
            distinctIps,
            currentIp,
            threshold: this.thresholds.suspiciousIpChanges,
            timeWindow: '1 hour',
            ipList: results.map((r: any) => r.ip_address),
          },
          status: AlertStatus.NEW,
          triggeredAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Failed to monitor geographic anomaly', { error, userAddress });
    }
  }

  /**
   * Run all monitoring checks
   */
  static async runAllChecks(): Promise<void> {
    logger.info('Running security monitoring checks');

    try {
      await Promise.all([
        this.monitorFailedWalletGeneration(),
        this.monitorFailedAuthentication(),
        this.monitorBulkDataExports(),
        this.monitorConsentRevocations(),
      ]);

      logger.info('Security monitoring checks completed');
    } catch (error) {
      logger.error('Failed to run monitoring checks', { error });
    }
  }

  /**
   * Get active alerts
   * @param limit - Maximum number of alerts to return
   * @returns Array of active alerts
   */
  static async getActiveAlerts(limit: number = 50): Promise<SecurityAlert[]> {
    try {
      const results = await query<any>(
        `SELECT
          id, alert_id, alert_type, severity, user_address, description,
          metadata, status, triggered_at, resolved_at, resolved_by, resolution_notes
         FROM security_alerts
         WHERE status IN ('new', 'investigating')
         ORDER BY triggered_at DESC
         LIMIT $1`,
        [limit]
      );

      return results.map((row) => ({
        id: row.id,
        alertId: row.alert_id,
        alertType: row.alert_type,
        severity: row.severity as AlertSeverity,
        userAddress: row.user_address,
        description: row.description,
        metadata: row.metadata,
        status: row.status as AlertStatus,
        triggeredAt: new Date(row.triggered_at),
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
        resolvedBy: row.resolved_by,
        resolutionNotes: row.resolution_notes,
      }));
    } catch (error) {
      logger.error('Failed to get active alerts', { error });
      throw new Error('Failed to get active alerts');
    }
  }

  /**
   * Resolve an alert
   * @param alertId - Alert ID
   * @param resolvedBy - Who resolved the alert
   * @param resolutionNotes - Notes about resolution
   * @param falsePositive - Whether it was a false positive
   */
  static async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes: string,
    falsePositive: boolean = false
  ): Promise<void> {
    try {
      await query(
        `UPDATE security_alerts
         SET status = $1,
             resolved_at = NOW(),
             resolved_by = $2,
             resolution_notes = $3
         WHERE alert_id = $4`,
        [
          falsePositive ? AlertStatus.FALSE_POSITIVE : AlertStatus.RESOLVED,
          resolvedBy,
          resolutionNotes,
          alertId,
        ]
      );

      logger.info('Security alert resolved', {
        alertId,
        resolvedBy,
        falsePositive,
      });
    } catch (error) {
      logger.error('Failed to resolve alert', { error, alertId });
      throw new Error('Failed to resolve alert');
    }
  }

  /**
   * Get alert statistics
   * @param days - Number of days to analyze
   * @returns Alert statistics
   */
  static async getAlertStats(
    days: number = 30
  ): Promise<{
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByType: Record<string, number>;
    alertsByStatus: Record<string, number>;
    falsePositiveRate: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await query<any>(
        `SELECT
          severity,
          alert_type,
          status,
          COUNT(*) as count
         FROM security_alerts
         WHERE triggered_at >= $1
         GROUP BY severity, alert_type, status`,
        [startDate]
      );

      const alertsBySeverity: Record<string, number> = {};
      const alertsByType: Record<string, number> = {};
      const alertsByStatus: Record<string, number> = {};
      let totalAlerts = 0;
      let falsePositives = 0;

      results.forEach((row) => {
        const count = parseInt(row.count);
        totalAlerts += count;

        alertsBySeverity[row.severity] = (alertsBySeverity[row.severity] || 0) + count;
        alertsByType[row.alert_type] = (alertsByType[row.alert_type] || 0) + count;
        alertsByStatus[row.status] = (alertsByStatus[row.status] || 0) + count;

        if (row.status === AlertStatus.FALSE_POSITIVE) {
          falsePositives += count;
        }
      });

      return {
        totalAlerts,
        alertsBySeverity,
        alertsByType,
        alertsByStatus,
        falsePositiveRate: totalAlerts > 0 ? falsePositives / totalAlerts : 0,
      };
    } catch (error) {
      logger.error('Failed to get alert stats', { error });
      throw new Error('Failed to get alert statistics');
    }
  }

  /**
   * Send alert notifications through configured channels
   * @param alert - Security alert
   */
  private static async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    for (const channel of this.notificationChannels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'log':
            await this.sendLogNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.config);
            break;
        }
      } catch (error) {
        logger.error('Failed to send notification', {
          error,
          channel: channel.type,
          alertId: alert.alertId,
        });
      }
    }
  }

  /**
   * Send log notification
   */
  private static async sendLogNotification(alert: SecurityAlert): Promise<void> {
    const logLevel = alert.severity === AlertSeverity.CRITICAL ? 'error' : 'warn';
    logger[logLevel]('SECURITY ALERT', {
      alertId: alert.alertId,
      alertType: alert.alertType,
      severity: alert.severity,
      description: alert.description,
      userAddress: alert.userAddress,
      metadata: alert.metadata,
    });
  }

  /**
   * Send email notification
   * Placeholder for email integration
   */
  private static async sendEmailNotification(
    alert: SecurityAlert,
    config: Record<string, any>
  ): Promise<void> {
    // TODO: Implement email notification via SendGrid, AWS SES, etc.
    logger.info('Email notification would be sent', { alert, config });
  }

  /**
   * Send Slack notification
   * Placeholder for Slack integration
   */
  private static async sendSlackNotification(
    alert: SecurityAlert,
    config: Record<string, any>
  ): Promise<void> {
    // TODO: Implement Slack webhook integration
    logger.info('Slack notification would be sent', { alert, config });
  }

  /**
   * Send webhook notification
   * Placeholder for generic webhook
   */
  private static async sendWebhookNotification(
    alert: SecurityAlert,
    config: Record<string, any>
  ): Promise<void> {
    // TODO: Implement generic webhook POST
    logger.info('Webhook notification would be sent', { alert, config });
  }

  /**
   * Configure monitoring thresholds
   * @param thresholds - New threshold configuration
   */
  static configureThresholds(thresholds: Partial<MonitoringThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info('Monitoring thresholds updated', { thresholds: this.thresholds });
  }

  /**
   * Add notification channel
   * @param channel - Notification channel configuration
   */
  static addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.push(channel);
    logger.info('Notification channel added', { type: channel.type });
  }
}
