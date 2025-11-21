import { query } from '../db';
import { logger } from '../server/utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Event categories for audit logs
 */
export enum EventCategory {
  AUTHENTICATION = 'authentication',
  WALLET = 'wallet',
  COMPLIANCE = 'compliance',
  SECURITY = 'security',
  TRANSACTION = 'transaction',
}

/**
 * Event severity levels
 */
export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Event status
 */
export enum EventStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  userAddress?: string;
  ssoId?: string;
  eventType: string;
  eventCategory: EventCategory;
  severity: EventSeverity;
  walletAddress?: string;
  operation: string;
  status: EventStatus;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdBy?: string;
}

/**
 * Audit log query result
 */
export interface AuditLogRecord extends AuditLogEntry {
  id: number;
  eventId: string;
  createdAt: Date;
}

/**
 * Audit trail filter options
 */
export interface AuditTrailFilter {
  userAddress?: string;
  walletAddress?: string;
  eventType?: string;
  eventCategory?: EventCategory;
  severity?: EventSeverity;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * User data export structure
 */
export interface UserDataExport {
  userInfo: any;
  auditLogs: AuditLogRecord[];
  consents: any[];
  exportedAt: Date;
  retentionNotice: string;
}

/**
 * AuditService - Comprehensive audit logging for compliance
 */
export class AuditService {
  /**
   * Log a general audit event
   * @param entry - Audit log entry details
   * @returns Event ID for correlation
   */
  static async logEvent(entry: AuditLogEntry): Promise<string> {
    const eventId = uuidv4();

    try {
      await query(
        `INSERT INTO wallet_audit_logs (
          event_id, user_address, sso_id, event_type, event_category,
          severity, wallet_address, operation, status, ip_address,
          user_agent, request_id, metadata, error_message, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          eventId,
          entry.userAddress || null,
          entry.ssoId || null,
          entry.eventType,
          entry.eventCategory,
          entry.severity,
          entry.walletAddress || null,
          entry.operation,
          entry.status,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.requestId || null,
          entry.metadata ? JSON.stringify(entry.metadata) : '{}',
          entry.errorMessage || null,
          entry.createdBy || 'system',
        ]
      );

      logger.debug('Audit event logged', {
        eventId,
        eventType: entry.eventType,
        userAddress: entry.userAddress,
        operation: entry.operation,
        status: entry.status,
      });

      return eventId;
    } catch (error) {
      logger.error('Failed to log audit event', {
        error,
        eventType: entry.eventType,
        operation: entry.operation,
      });
      // Don't throw here to avoid breaking the main flow, but log error
      return eventId;
    }
  }

  // ... (rest of the methods are similar, just updating imports and types if needed)
  // I'll include the rest of the methods for completeness

  static async logWalletGeneration(
    userAddress: string,
    walletAddress: string,
    metadata: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      ssoId: metadata.ssoId,
      eventType: 'wallet_generated',
      eventCategory: EventCategory.WALLET,
      severity: EventSeverity.INFO,
      walletAddress,
      operation: 'generate_wallet',
      status: EventStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      createdBy: 'wallet_service',
    });
  }

  static async logWalletAccess(
    userAddress: string,
    walletAddress: string,
    operation: string,
    ipAddress?: string,
    requestId?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: 'wallet_accessed',
      eventCategory: EventCategory.SECURITY,
      severity: EventSeverity.WARNING,
      walletAddress,
      operation,
      status: EventStatus.SUCCESS,
      ipAddress,
      requestId,
      metadata: {
        accessTime: new Date().toISOString(),
      },
      createdBy: 'wallet_service',
    });
  }

  static async logWalletFunding(
    userAddress: string,
    walletAddress: string,
    amount: string,
    txHash?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: 'wallet_funded',
      eventCategory: EventCategory.WALLET,
      severity: EventSeverity.INFO,
      walletAddress,
      operation: 'fund_wallet',
      status: EventStatus.SUCCESS,
      metadata: {
        amount,
        txHash,
        source: 'faucet',
      },
      createdBy: 'wallet_service',
    });
  }

  static async logAuthentication(
    userAddress: string | null,
    ssoId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress: userAddress || undefined,
      ssoId,
      eventType: success ? 'authentication_success' : 'authentication_failure',
      eventCategory: EventCategory.AUTHENTICATION,
      severity: success ? EventSeverity.INFO : EventSeverity.WARNING,
      operation: 'user_login',
      status: success ? EventStatus.SUCCESS : EventStatus.FAILURE,
      ipAddress,
      userAgent,
      errorMessage,
      metadata: {
        method: 'nyu_sso',
        timestamp: new Date().toISOString(),
      },
      createdBy: 'auth_service',
    });
  }

  static async logConsent(
    userAddress: string,
    consentType: string,
    granted: boolean,
    version: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: granted ? 'consent_granted' : 'consent_revoked',
      eventCategory: EventCategory.COMPLIANCE,
      severity: EventSeverity.INFO,
      operation: granted ? 'grant_consent' : 'revoke_consent',
      status: EventStatus.SUCCESS,
      ipAddress,
      metadata: {
        consentType,
        version,
        timestamp: new Date().toISOString(),
      },
      createdBy: 'compliance_service',
    });
  }

  static async logDataExport(
    userAddress: string,
    format: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: 'data_exported',
      eventCategory: EventCategory.COMPLIANCE,
      severity: EventSeverity.INFO,
      operation: 'export_user_data',
      status: EventStatus.SUCCESS,
      ipAddress,
      metadata: {
        format,
        gdprArticle: '20',
        timestamp: new Date().toISOString(),
      },
      createdBy: 'compliance_service',
    });
  }

  static async logDataDeletionRequest(
    userAddress: string,
    requestType: 'gdpr' | 'ccpa' | 'user_initiated',
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: 'data_deletion_requested',
      eventCategory: EventCategory.COMPLIANCE,
      severity: EventSeverity.WARNING,
      operation: 'request_data_deletion',
      status: EventStatus.PENDING,
      ipAddress,
      metadata: {
        requestType,
        gdprArticle: requestType === 'gdpr' ? '17' : null,
        timestamp: new Date().toISOString(),
      },
      createdBy: 'compliance_service',
    });
  }

  static async logTransactionSigning(
    userAddress: string,
    txHash: string,
    txType: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      userAddress,
      eventType: 'transaction_signed',
      eventCategory: EventCategory.TRANSACTION,
      severity: EventSeverity.INFO,
      walletAddress: userAddress,
      operation: 'sign_transaction',
      status: EventStatus.SUCCESS,
      ipAddress,
      metadata: {
        txHash,
        txType,
        timestamp: new Date().toISOString(),
      },
      createdBy: 'transaction_service',
    });
  }

  static async getAuditTrail(filter: AuditTrailFilter): Promise<AuditLogRecord[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filter.userAddress) {
        conditions.push(`user_address = $${paramIndex++}`);
        params.push(filter.userAddress);
      }

      if (filter.walletAddress) {
        conditions.push(`wallet_address = $${paramIndex++}`);
        params.push(filter.walletAddress);
      }

      if (filter.eventType) {
        conditions.push(`event_type = $${paramIndex++}`);
        params.push(filter.eventType);
      }

      if (filter.eventCategory) {
        conditions.push(`event_category = $${paramIndex++}`);
        params.push(filter.eventCategory);
      }

      if (filter.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(filter.severity);
      }

      if (filter.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filter.status);
      }

      if (filter.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(filter.startDate);
      }

      if (filter.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(filter.endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filter.limit || 100;
      const offset = filter.offset || 0;

      const sql = `
        SELECT
          id, event_id, user_address, sso_id, event_type, event_category,
          severity, wallet_address, operation, status, ip_address, user_agent,
          request_id, metadata, error_message, created_at, created_by
        FROM wallet_audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await query(sql, params);
      const rows = result.rows;

      return rows.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        userAddress: row.user_address,
        ssoId: row.sso_id,
        eventType: row.event_type,
        eventCategory: row.event_category as EventCategory,
        severity: row.severity as EventSeverity,
        walletAddress: row.wallet_address,
        operation: row.operation,
        status: row.status as EventStatus,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        requestId: row.request_id,
        metadata: row.metadata,
        errorMessage: row.error_message,
        createdAt: row.created_at,
        createdBy: row.created_by,
      }));
    } catch (error) {
      logger.error('Failed to get audit trail', { error, filter });
      throw new Error('Failed to retrieve audit trail');
    }
  }

  // ... (skipping exportUserData and others for brevity if not strictly needed for auth, but I should probably include them if I want full migration)
  // I'll include them.

  static async exportUserData(userAddress: string): Promise<UserDataExport> {
    try {
      const users = await query(
        'SELECT * FROM users WHERE address = $1',
        [userAddress]
      );

      const auditLogs = await this.getAuditTrail({
        userAddress,
        limit: 10000,
      });

      const consents = await query(
        'SELECT * FROM user_consents WHERE user_address = $1',
        [userAddress]
      );

      return {
        userInfo: users.rows[0] || null,
        auditLogs,
        consents: consents.rows,
        exportedAt: new Date(),
        retentionNotice: 'This data is retained for 2 years in compliance with GDPR Article 30. Blockchain data is permanently immutable.',
      };
    } catch (error) {
      logger.error('Failed to export user data', { error, userAddress });
      throw new Error('Failed to export user data');
    }
  }

  static async flagSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    try {
      const eventId = await this.logEvent({
        ...entry,
        severity: EventSeverity.CRITICAL,
      });

      await query(
        `INSERT INTO security_alerts (
          alert_type, severity, user_address, description, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          entry.eventType,
          'high',
          entry.userAddress || null,
          `Suspicious activity detected: ${entry.operation}`,
          JSON.stringify({
            eventId,
            ...entry.metadata,
          }),
        ]
      );

      logger.warn('Suspicious activity flagged', {
        eventId,
        userAddress: entry.userAddress,
        operation: entry.operation,
      });
    } catch (error) {
      logger.error('Failed to flag suspicious activity', { error, entry });
    }
  }

  static async getUserAuditStats(
    userAddress: string,
    days: number = 30
  ): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failureRate: number;
    lastActivity: Date | null;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await query(
        `SELECT
          COUNT(*) as total_events,
          event_category,
          severity,
          status,
          MAX(created_at) as last_activity
        FROM wallet_audit_logs
        WHERE user_address = $1 AND created_at >= $2
        GROUP BY event_category, severity, status`,
        [userAddress, startDate]
      );

      const eventsByCategory: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      let totalEvents = 0;
      let failureCount = 0;
      let lastActivity: Date | null = null;

      result.rows.forEach((row: any) => {
        const count = parseInt(row.total_events);
        totalEvents += count;

        eventsByCategory[row.event_category] = (eventsByCategory[row.event_category] || 0) + count;
        eventsBySeverity[row.severity] = (eventsBySeverity[row.severity] || 0) + count;

        if (row.status === 'failure') {
          failureCount += count;
        }

        if (!lastActivity || new Date(row.last_activity) > lastActivity) {
          lastActivity = new Date(row.last_activity);
        }
      });

      return {
        totalEvents,
        eventsByCategory,
        eventsBySeverity,
        failureRate: totalEvents > 0 ? failureCount / totalEvents : 0,
        lastActivity,
      };
    } catch (error) {
      logger.error('Failed to get audit stats', { error, userAddress });
      throw new Error('Failed to get audit statistics');
    }
  }
}