import { pool, query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { AuditService } from './auditService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Consent types for GDPR compliance
 */
export enum ConsentType {
  WALLET_GENERATION = 'wallet_generation',
  PRIVATE_KEY_STORAGE = 'private_key_storage',
  DATA_PROCESSING = 'data_processing',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  THIRD_PARTY_SHARING = 'third_party_sharing',
}

/**
 * Consent status
 */
export interface ConsentStatus {
  consentType: ConsentType;
  granted: boolean;
  version: string;
  grantedAt?: Date;
  revokedAt?: Date;
}

/**
 * User data export for GDPR Article 20
 */
export interface UserDataExport {
  exportId: string;
  exportDate: Date;
  format: string;
  user: {
    address: string;
    ssoId?: string;
    email?: string;
    displayName?: string;
    role: string;
    createdAt: Date;
  };
  wallet: {
    address: string;
    publicKey: string;
    generated: boolean;
    createdAt: Date;
  };
  consents: ConsentStatus[];
  auditTrail: any[];
  transactions?: any[];
  governanceActivity?: any[];
  retentionPolicy: string;
  rightsNotice: string;
}

/**
 * Deletion report for GDPR Article 17
 */
export interface DeletionReport {
  requestId: string;
  userAddress: string;
  requestDate: Date;
  completionDate: Date;
  deletedRecords: {
    table: string;
    recordCount: number;
    method: 'deleted' | 'anonymized' | 'retained';
    reason?: string;
  }[];
  blockchainNotice: string;
  status: 'completed' | 'partial' | 'failed';
  errors?: string[];
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  reportId: string;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  deletionRequests: number;
  exportRequests: number;
  consentChanges: {
    granted: number;
    revoked: number;
    byType: Record<string, { granted: number; revoked: number }>;
  };
  securityIncidents: number;
  dataRetention: {
    recordsAnonymized: number;
    recordsArchived: number;
    recordsDeleted: number;
  };
  complianceStatus: 'compliant' | 'issues_found' | 'critical';
  issues: string[];
  recommendations: string[];
}

/**
 * ComplianceService - GDPR and CCPA compliance operations
 *
 * Implements:
 * - GDPR Article 15: Right of Access
 * - GDPR Article 16: Right to Rectification
 * - GDPR Article 17: Right to Erasure
 * - GDPR Article 20: Right to Data Portability
 * - GDPR Article 7: Conditions for Consent
 * - CCPA: Right to Delete
 * - CCPA: Right to Know
 */
export class ComplianceService {
  private static readonly CURRENT_CONSENT_VERSION = '1.0';
  private static readonly DATA_RETENTION_DAYS = 730; // 2 years
  private static readonly EXPORT_EXPIRY_DAYS = 30;

  /**
   * GDPR Article 15: Right of Access
   * Export all user data in machine-readable format
   * @param userAddress - User's wallet address
   * @param format - Export format (json, csv, xml)
   * @param ipAddress - User's IP address
   * @returns Complete user data export
   */
  static async exportUserData(
    userAddress: string,
    format: 'json' | 'csv' | 'xml' = 'json',
    ipAddress?: string
  ): Promise<UserDataExport> {
    try {
      const exportId = uuidv4();

      // Get user information
      const users = await query<any>(
        `SELECT address, sso_id, email, display_name, role, created_at,
                wallet_public_key, wallet_generated, wallet_created_at
         FROM users WHERE address = $1`,
        [userAddress]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Get consents
      const consents = await this.getConsentStatus(userAddress);

      // Get audit trail (last 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const auditTrail = await AuditService.getAuditTrail({
        userAddress,
        startDate: twoYearsAgo,
        limit: 10000,
      });

      // Get governance activity
      const governanceActivity = await query(
        `SELECT proposal_id, vote_value, weight, voted_at
         FROM votes WHERE voter_address = $1
         ORDER BY voted_at DESC`,
        [userAddress]
      );

      // Create export record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.EXPORT_EXPIRY_DAYS);

      await query(
        `INSERT INTO data_export_requests (
          request_id, user_address, sso_id, export_format, status,
          expires_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          exportId,
          userAddress,
          user.sso_id,
          format,
          'completed',
          expiresAt,
          JSON.stringify({ recordCount: auditTrail.length }),
        ]
      );

      // Log the export
      await AuditService.logDataExport(userAddress, format, ipAddress);

      const exportData: UserDataExport = {
        exportId,
        exportDate: new Date(),
        format,
        user: {
          address: user.address,
          ssoId: user.sso_id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          createdAt: user.created_at,
        },
        wallet: {
          address: user.address,
          publicKey: user.wallet_public_key,
          generated: user.wallet_generated,
          createdAt: user.wallet_created_at,
        },
        consents,
        auditTrail: auditTrail.map((log) => ({
          eventId: log.eventId,
          eventType: log.eventType,
          operation: log.operation,
          status: log.status,
          timestamp: log.createdAt,
          metadata: log.metadata,
        })),
        governanceActivity,
        retentionPolicy: `Data is retained for ${this.DATA_RETENTION_DAYS} days (2 years) in compliance with GDPR Article 30. After this period, data is anonymized or deleted.`,
        rightsNotice: 'Under GDPR, you have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data. Contact privacy@example.com for assistance.',
      };

      logger.info('User data exported', {
        exportId,
        userAddress,
        format,
        recordCount: auditTrail.length,
      });

      return exportData;
    } catch (error) {
      logger.error('Failed to export user data', { error, userAddress });
      throw new Error('Failed to export user data');
    }
  }

  /**
   * GDPR Article 17: Right to Erasure (Right to be Forgotten)
   * CCPA: Right to Delete
   * @param userAddress - User's wallet address
   * @param requestType - Type of deletion request
   * @param deleteBlockchainData - Note: blockchain data cannot be deleted
   * @param ipAddress - User's IP address
   * @returns Deletion report
   */
  static async deleteUserData(
    userAddress: string,
    requestType: 'gdpr' | 'ccpa' | 'user_initiated' = 'user_initiated',
    deleteBlockchainData: boolean = false,
    ipAddress?: string
  ): Promise<DeletionReport> {
    const requestId = uuidv4();
    const requestDate = new Date();
    const deletedRecords: DeletionReport['deletedRecords'] = [];
    const errors: string[] = [];

    try {
      // Create deletion request record
      await query(
        `INSERT INTO data_deletion_requests (
          request_id, user_address, request_type, status,
          delete_blockchain_data, requested_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [requestId, userAddress, requestType, 'processing', deleteBlockchainData, userAddress]
      );

      // Log the deletion request
      await AuditService.logDataDeletionRequest(userAddress, requestType, ipAddress);

      // Start transaction for data deletion
      await transaction(async (client) => {
        // 1. Anonymize audit logs (retain for compliance, but remove PII)
        const auditResult = await client.query(
          `UPDATE wallet_audit_logs
           SET user_address = 'DELETED',
               sso_id = NULL,
               ip_address = NULL,
               user_agent = NULL,
               metadata = jsonb_set(metadata, '{anonymized}', 'true')
           WHERE user_address = $1`,
          [userAddress]
        );
        deletedRecords.push({
          table: 'wallet_audit_logs',
          recordCount: auditResult.rowCount || 0,
          method: 'anonymized',
          reason: 'Retained for legal compliance (GDPR Article 17(3)(b)) but anonymized',
        });

        // 2. Delete or revoke consents
        const consentResult = await client.query(
          `UPDATE user_consents
           SET granted = false,
               revoked_at = NOW(),
               updated_at = NOW()
           WHERE user_address = $1 AND granted = true`,
          [userAddress]
        );
        deletedRecords.push({
          table: 'user_consents',
          recordCount: consentResult.rowCount || 0,
          method: 'deleted',
        });

        // 3. Anonymize security alerts
        const alertResult = await client.query(
          `UPDATE security_alerts
           SET user_address = 'DELETED',
               metadata = jsonb_set(metadata, '{anonymized}', 'true')
           WHERE user_address = $1`,
          [userAddress]
        );
        deletedRecords.push({
          table: 'security_alerts',
          recordCount: alertResult.rowCount || 0,
          method: 'anonymized',
        });

        // 4. Anonymize user record (keep minimal data for blockchain reference)
        const userResult = await client.query(
          `UPDATE users
           SET email = NULL,
               display_name = 'Deleted User',
               first_name = NULL,
               last_name = NULL,
               sso_id = NULL,
               encrypted_private_key = NULL,
               metadata = jsonb_build_object('deleted', true, 'deleted_at', NOW())
           WHERE address = $1`,
          [userAddress]
        );
        deletedRecords.push({
          table: 'users',
          recordCount: userResult.rowCount || 0,
          method: 'anonymized',
          reason: 'Address retained for blockchain reference integrity',
        });

        // 5. Handle votes (cannot delete due to governance integrity)
        const voteResult = await client.query(
          `SELECT COUNT(*) as count FROM votes WHERE voter_address = $1`,
          [userAddress]
        );
        if (voteResult.rows[0].count > 0) {
          deletedRecords.push({
            table: 'votes',
            recordCount: parseInt(voteResult.rows[0].count),
            method: 'retained',
            reason: 'Governance votes retained for organizational integrity (GDPR Article 17(3)(e))',
          });
        }
      });

      const completionDate = new Date();

      // Update deletion request status
      await query(
        `UPDATE data_deletion_requests
         SET status = $1,
             processed_at = $2,
             completed_at = $3,
             deletion_report = $4
         WHERE request_id = $5`,
        [
          errors.length > 0 ? 'partial' : 'completed',
          completionDate,
          completionDate,
          JSON.stringify(deletedRecords),
          requestId,
        ]
      );

      const report: DeletionReport = {
        requestId,
        userAddress,
        requestDate,
        completionDate,
        deletedRecords,
        blockchainNotice: deleteBlockchainData
          ? 'Note: On-chain blockchain data (transactions, votes) cannot be deleted due to the immutable nature of blockchain technology. This is a technical limitation and is noted as a lawful exception under GDPR Article 17(3).'
          : 'Blockchain data was not requested for deletion.',
        status: errors.length > 0 ? 'partial' : 'completed',
        errors: errors.length > 0 ? errors : undefined,
      };

      logger.info('User data deletion completed', {
        requestId,
        userAddress,
        recordsAffected: deletedRecords.reduce((sum, r) => sum + r.recordCount, 0),
      });

      return report;
    } catch (error) {
      logger.error('Failed to delete user data', { error, userAddress, requestId });

      // Update request status to failed
      await query(
        `UPDATE data_deletion_requests
         SET status = 'failed',
             error_message = $1,
             processed_at = NOW()
         WHERE request_id = $2`,
        [error instanceof Error ? error.message : 'Unknown error', requestId]
      );

      throw new Error('Failed to delete user data');
    }
  }

  /**
   * GDPR Article 16: Right to Rectification
   * Update user data
   * @param userAddress - User's wallet address
   * @param updates - Fields to update
   * @param ipAddress - User's IP address
   */
  static async updateUserData(
    userAddress: string,
    updates: {
      email?: string;
      displayName?: string;
      firstName?: string;
      lastName?: string;
    },
    ipAddress?: string
  ): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.email !== undefined) {
        setClauses.push(`email = $${paramIndex++}`);
        params.push(updates.email);
      }
      if (updates.displayName !== undefined) {
        setClauses.push(`display_name = $${paramIndex++}`);
        params.push(updates.displayName);
      }
      if (updates.firstName !== undefined) {
        setClauses.push(`first_name = $${paramIndex++}`);
        params.push(updates.firstName);
      }
      if (updates.lastName !== undefined) {
        setClauses.push(`last_name = $${paramIndex++}`);
        params.push(updates.lastName);
      }

      if (setClauses.length === 0) {
        return; // Nothing to update
      }

      params.push(userAddress);

      await query(
        `UPDATE users
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE address = $${paramIndex}`,
        params
      );

      // Log the update
      await AuditService.logEvent({
        userAddress,
        eventType: 'data_rectified',
        eventCategory: 'compliance' as any,
        severity: 'info' as any,
        operation: 'update_user_data',
        status: 'success' as any,
        ipAddress,
        metadata: {
          gdprArticle: '16',
          updatedFields: Object.keys(updates),
        },
        createdBy: 'compliance_service',
      });

      logger.info('User data updated', { userAddress, fields: Object.keys(updates) });
    } catch (error) {
      logger.error('Failed to update user data', { error, userAddress });
      throw new Error('Failed to update user data');
    }
  }

  /**
   * GDPR Article 20: Right to Data Portability
   * Export in machine-readable format
   * @param userAddress - User's wallet address
   * @returns JSON string of user data
   */
  static async exportInMachineReadableFormat(userAddress: string): Promise<string> {
    try {
      const exportData = await this.exportUserData(userAddress, 'json');
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      logger.error('Failed to export in machine-readable format', { error, userAddress });
      throw new Error('Failed to export data');
    }
  }

  /**
   * GDPR Article 7: Record Consent
   * @param userAddress - User's wallet address
   * @param consentType - Type of consent
   * @param version - Consent version
   * @param ipAddress - User's IP address
   * @param userAgent - User's user agent
   */
  static async recordConsent(
    userAddress: string,
    consentType: ConsentType,
    version: string = this.CURRENT_CONSENT_VERSION,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO user_consents (
          user_address, consent_type, consent_version, granted,
          granted_at, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
        ON CONFLICT (user_address, consent_type)
        DO UPDATE SET
          granted = true,
          granted_at = NOW(),
          revoked_at = NULL,
          consent_version = $3,
          ip_address = $5,
          user_agent = $6,
          updated_at = NOW()`,
        [userAddress, consentType, version, true, ipAddress, userAgent]
      );

      // Log consent
      await AuditService.logConsent(userAddress, consentType, true, version, ipAddress);

      logger.info('Consent recorded', { userAddress, consentType, version });
    } catch (error) {
      logger.error('Failed to record consent', { error, userAddress, consentType });
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Revoke consent
   * @param userAddress - User's wallet address
   * @param consentType - Type of consent to revoke
   * @param ipAddress - User's IP address
   */
  static async revokeConsent(
    userAddress: string,
    consentType: ConsentType,
    ipAddress?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE user_consents
         SET granted = false,
             revoked_at = NOW(),
             updated_at = NOW()
         WHERE user_address = $1 AND consent_type = $2`,
        [userAddress, consentType]
      );

      // Log consent revocation
      await AuditService.logConsent(
        userAddress,
        consentType,
        false,
        this.CURRENT_CONSENT_VERSION,
        ipAddress
      );

      logger.info('Consent revoked', { userAddress, consentType });
    } catch (error) {
      logger.error('Failed to revoke consent', { error, userAddress, consentType });
      throw new Error('Failed to revoke consent');
    }
  }

  /**
   * Get current consent status for a user
   * @param userAddress - User's wallet address
   * @returns Array of consent statuses
   */
  static async getConsentStatus(userAddress: string): Promise<ConsentStatus[]> {
    try {
      const consents = await query<any>(
        `SELECT consent_type, granted, consent_version, granted_at, revoked_at
         FROM user_consents
         WHERE user_address = $1
         ORDER BY consent_type`,
        [userAddress]
      );

      return consents.map((c) => ({
        consentType: c.consent_type as ConsentType,
        granted: c.granted,
        version: c.consent_version,
        grantedAt: c.granted_at ? new Date(c.granted_at) : undefined,
        revokedAt: c.revoked_at ? new Date(c.revoked_at) : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get consent status', { error, userAddress });
      throw new Error('Failed to get consent status');
    }
  }

  /**
   * Apply data retention policy
   * Anonymize records older than retention period
   * @returns Number of records processed
   */
  static async applyRetentionPolicy(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.DATA_RETENTION_DAYS);

      const result = await query<any>(
        `UPDATE wallet_audit_logs
         SET user_address = 'ANONYMIZED',
             sso_id = NULL,
             ip_address = NULL,
             user_agent = NULL,
             metadata = jsonb_set(COALESCE(metadata, '{}'), '{retention_policy_applied}', 'true')
         WHERE created_at < $1
           AND user_address IS NOT NULL
           AND user_address != 'ANONYMIZED'
           AND user_address != 'DELETED'`,
        [cutoffDate]
      );

      const recordCount = result[0]?.count || 0;

      logger.info('Data retention policy applied', {
        cutoffDate,
        recordsAnonymized: recordCount,
      });

      return recordCount;
    } catch (error) {
      logger.error('Failed to apply retention policy', { error });
      throw new Error('Failed to apply retention policy');
    }
  }

  /**
   * Anonymize old records
   * @param daysOld - Age threshold in days
   * @returns Number of records anonymized
   */
  static async anonymizeOldRecords(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await this.applyRetentionPolicy();
    } catch (error) {
      logger.error('Failed to anonymize old records', { error });
      throw new Error('Failed to anonymize records');
    }
  }

  /**
   * Generate compliance report
   * @param startDate - Report period start
   * @param endDate - Report period end
   * @returns Compliance report
   */
  static async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    try {
      const reportId = uuidv4();

      // Total and active users
      const userStats = await query<any>(
        `SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE created_at >= $1) as new_users,
          COUNT(*) FILTER (WHERE updated_at >= $1) as active_users
         FROM users
         WHERE metadata->>'deleted' IS NULL OR metadata->>'deleted' = 'false'`,
        [startDate]
      );

      // Deletion requests
      const deletionStats = await query<any>(
        `SELECT COUNT(*) as deletion_requests
         FROM data_deletion_requests
         WHERE requested_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      // Export requests
      const exportStats = await query<any>(
        `SELECT COUNT(*) as export_requests
         FROM data_export_requests
         WHERE requested_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      // Consent changes
      const consentStats = await query<any>(
        `SELECT
          consent_type,
          COUNT(*) FILTER (WHERE granted = true AND granted_at BETWEEN $1 AND $2) as granted,
          COUNT(*) FILTER (WHERE granted = false AND revoked_at BETWEEN $1 AND $2) as revoked
         FROM user_consents
         WHERE (granted_at BETWEEN $1 AND $2) OR (revoked_at BETWEEN $1 AND $2)
         GROUP BY consent_type`,
        [startDate, endDate]
      );

      // Security incidents
      const securityStats = await query<any>(
        `SELECT COUNT(*) as security_incidents
         FROM security_alerts
         WHERE triggered_at BETWEEN $1 AND $2
           AND severity IN ('high', 'critical')`,
        [startDate, endDate]
      );

      const report: ComplianceReport = {
        reportId,
        periodStart: startDate,
        periodEnd: endDate,
        generatedAt: new Date(),
        totalUsers: parseInt(userStats[0]?.total_users || '0'),
        activeUsers: parseInt(userStats[0]?.active_users || '0'),
        newUsers: parseInt(userStats[0]?.new_users || '0'),
        deletionRequests: parseInt(deletionStats[0]?.deletion_requests || '0'),
        exportRequests: parseInt(exportStats[0]?.export_requests || '0'),
        consentChanges: {
          granted: 0,
          revoked: 0,
          byType: {},
        },
        securityIncidents: parseInt(securityStats[0]?.security_incidents || '0'),
        dataRetention: {
          recordsAnonymized: 0,
          recordsArchived: 0,
          recordsDeleted: 0,
        },
        complianceStatus: 'compliant',
        issues: [],
        recommendations: [],
      };

      // Process consent stats
      consentStats.forEach((stat: any) => {
        const granted = parseInt(stat.granted || '0');
        const revoked = parseInt(stat.revoked || '0');
        report.consentChanges.granted += granted;
        report.consentChanges.revoked += revoked;
        report.consentChanges.byType[stat.consent_type] = { granted, revoked };
      });

      // Determine compliance status
      if (report.securityIncidents > 10) {
        report.complianceStatus = 'issues_found';
        report.issues.push(`High number of security incidents: ${report.securityIncidents}`);
      }

      // Add recommendations
      if (report.deletionRequests > 0) {
        report.recommendations.push('Review data minimization practices');
      }
      if (report.consentChanges.revoked > report.consentChanges.granted) {
        report.recommendations.push('Review consent language and user experience');
      }

      logger.info('Compliance report generated', {
        reportId,
        period: { startDate, endDate },
        status: report.complianceStatus,
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', { error });
      throw new Error('Failed to generate compliance report');
    }
  }
}
