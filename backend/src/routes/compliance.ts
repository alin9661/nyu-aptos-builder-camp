import express, { Request, Response } from 'express';
import { AuthenticatedRequest, verifyAuth } from '../middleware/auth';
import { complianceAuditMiddleware, sensitiveOperationAudit } from '../middleware/audit';
import { ComplianceService, ConsentType } from '../services/complianceService';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Helper to get client IP
 */
const getClientIp = (req: Request): string | undefined => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  return req.socket.remoteAddress;
};

/**
 * Helper to get user agent
 */
const getUserAgent = (req: Request): string | undefined => {
  const userAgent = req.headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
};

// ============================================================================
// CONSENT MANAGEMENT (GDPR Article 7)
// ============================================================================

/**
 * POST /api/compliance/consent
 * Grant consent for data processing
 */
router.post(
  '/consent',
  verifyAuth,
  complianceAuditMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { consentType, version } = req.body;

      if (!consentType) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: consentType',
        });
        return;
      }

      // Validate consent type
      if (!Object.values(ConsentType).includes(consentType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid consent type',
          validTypes: Object.values(ConsentType),
        });
        return;
      }

      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      await ComplianceService.recordConsent(
        req.user!.address,
        consentType as ConsentType,
        version,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        message: 'Consent recorded successfully',
        consentType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to record consent', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to record consent',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * DELETE /api/compliance/consent/:type
 * Revoke consent for data processing
 */
router.delete(
  '/consent/:type',
  verifyAuth,
  complianceAuditMiddleware,
  sensitiveOperationAudit('revoke_consent'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { type } = req.params;

      // Validate consent type
      if (!Object.values(ConsentType).includes(type as ConsentType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid consent type',
          validTypes: Object.values(ConsentType),
        });
        return;
      }

      const ipAddress = getClientIp(req);

      await ComplianceService.revokeConsent(
        req.user!.address,
        type as ConsentType,
        ipAddress
      );

      res.json({
        success: true,
        message: 'Consent revoked successfully',
        consentType: type,
        timestamp: new Date().toISOString(),
        notice: 'Some services may be affected by consent revocation.',
      });
    } catch (error) {
      logger.error('Failed to revoke consent', {
        error,
        userAddress: req.user?.address,
        consentType: req.params.type,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to revoke consent',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/compliance/consent/status
 * Get current consent status
 */
router.get(
  '/consent/status',
  verifyAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const consents = await ComplianceService.getConsentStatus(req.user!.address);

      res.json({
        success: true,
        consents,
        retrievedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get consent status', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to get consent status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================================================
// DATA EXPORT (GDPR Article 20 - Right to Data Portability)
// ============================================================================

/**
 * GET /api/compliance/data/export
 * Export all user data (GDPR Article 20)
 */
router.get(
  '/data/export',
  verifyAuth,
  complianceAuditMiddleware,
  sensitiveOperationAudit('data_export'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const format = (req.query.format as string) || 'json';

      if (!['json', 'csv', 'xml'].includes(format)) {
        res.status(400).json({
          success: false,
          error: 'Invalid format',
          validFormats: ['json', 'csv', 'xml'],
        });
        return;
      }

      const ipAddress = getClientIp(req);

      const exportData = await ComplianceService.exportUserData(
        req.user!.address,
        format as 'json' | 'csv' | 'xml',
        ipAddress
      );

      res.json({
        success: true,
        data: exportData,
        exportId: exportData.exportId,
        gdprNotice: 'This export fulfills your right to data portability under GDPR Article 20.',
        expiryNotice: 'This export is available for 30 days.',
      });
    } catch (error) {
      logger.error('Failed to export user data', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to export user data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/compliance/data/export/json
 * Export in machine-readable JSON format
 */
router.get(
  '/data/export/json',
  verifyAuth,
  complianceAuditMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const jsonData = await ComplianceService.exportInMachineReadableFormat(
        req.user!.address
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user-data-${req.user!.address}-${Date.now()}.json"`
      );

      res.send(jsonData);
    } catch (error) {
      logger.error('Failed to export JSON data', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================================================
// DATA DELETION (GDPR Article 17 - Right to be Forgotten)
// ============================================================================

/**
 * POST /api/compliance/data/delete
 * Request data deletion (GDPR Article 17, CCPA)
 */
router.post(
  '/data/delete',
  verifyAuth,
  complianceAuditMiddleware,
  sensitiveOperationAudit('data_deletion'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { requestType, deleteBlockchainData, confirmation } = req.body;

      // Require explicit confirmation
      if (confirmation !== 'DELETE_MY_DATA') {
        res.status(400).json({
          success: false,
          error: 'Confirmation required',
          message: 'Please set confirmation field to "DELETE_MY_DATA" to proceed',
        });
        return;
      }

      const ipAddress = getClientIp(req);

      const deletionReport = await ComplianceService.deleteUserData(
        req.user!.address,
        requestType || 'user_initiated',
        deleteBlockchainData || false,
        ipAddress
      );

      res.json({
        success: true,
        message: 'Data deletion completed',
        report: deletionReport,
        gdprNotice: 'Your data has been deleted or anonymized in compliance with GDPR Article 17.',
        blockchainNotice: deletionReport.blockchainNotice,
        warning: 'This action cannot be undone. Your account access may be limited.',
      });
    } catch (error) {
      logger.error('Failed to delete user data', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to delete user data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================================================
// DATA RECTIFICATION (GDPR Article 16)
// ============================================================================

/**
 * PUT /api/compliance/data/rectify
 * Update user data (GDPR Article 16)
 */
router.put(
  '/data/rectify',
  verifyAuth,
  complianceAuditMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, displayName, firstName, lastName } = req.body;

      const updates: any = {};
      if (email !== undefined) updates.email = email;
      if (displayName !== undefined) updates.displayName = displayName;
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields provided for update',
          validFields: ['email', 'displayName', 'firstName', 'lastName'],
        });
        return;
      }

      const ipAddress = getClientIp(req);

      await ComplianceService.updateUserData(req.user!.address, updates, ipAddress);

      res.json({
        success: true,
        message: 'User data updated successfully',
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString(),
        gdprNotice: 'Your data has been rectified in compliance with GDPR Article 16.',
      });
    } catch (error) {
      logger.error('Failed to update user data', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update user data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================================================
// AUDIT TRAIL (GDPR Article 15 - Right of Access)
// ============================================================================

/**
 * GET /api/compliance/audit-trail
 * Get user's audit trail
 */
router.get(
  '/audit-trail',
  verifyAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, limit, offset } = req.query;

      const filter: any = {
        userAddress: req.user!.address,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
      };

      if (startDate) {
        filter.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filter.endDate = new Date(endDate as string);
      }

      const auditTrail = await AuditService.getAuditTrail(filter);
      const stats = await AuditService.getUserAuditStats(req.user!.address, 30);

      res.json({
        success: true,
        auditTrail,
        stats,
        filter,
        totalRecords: auditTrail.length,
        gdprNotice: 'This audit trail is maintained for your right of access under GDPR Article 15.',
      });
    } catch (error) {
      logger.error('Failed to get audit trail', {
        error,
        userAddress: req.user?.address,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================================================
// COMPLIANCE INFORMATION
// ============================================================================

/**
 * GET /api/compliance/info
 * Get compliance information and user rights
 */
router.get('/info', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    compliance: {
      gdpr: {
        applicable: true,
        rights: [
          {
            article: 15,
            right: 'Right of Access',
            description: 'You have the right to access your personal data',
            endpoint: 'GET /api/compliance/audit-trail',
          },
          {
            article: 16,
            right: 'Right to Rectification',
            description: 'You have the right to correct inaccurate personal data',
            endpoint: 'PUT /api/compliance/data/rectify',
          },
          {
            article: 17,
            right: 'Right to Erasure',
            description: 'You have the right to request deletion of your personal data',
            endpoint: 'POST /api/compliance/data/delete',
          },
          {
            article: 20,
            right: 'Right to Data Portability',
            description: 'You have the right to receive your data in a machine-readable format',
            endpoint: 'GET /api/compliance/data/export',
          },
          {
            article: 7,
            right: 'Consent',
            description: 'You have the right to withdraw consent at any time',
            endpoint: 'DELETE /api/compliance/consent/:type',
          },
        ],
      },
      ccpa: {
        applicable: true,
        rights: [
          {
            right: 'Right to Know',
            description: 'You have the right to know what personal information is collected',
            endpoint: 'GET /api/compliance/data/export',
          },
          {
            right: 'Right to Delete',
            description: 'You have the right to request deletion of your personal information',
            endpoint: 'POST /api/compliance/data/delete',
          },
          {
            right: 'Right to Opt-Out',
            description: 'You have the right to opt-out of the sale of personal information',
            note: 'We do not sell personal information',
          },
        ],
      },
      dataRetention: {
        period: '2 years (730 days)',
        policy: 'Personal data is retained for 2 years, after which it is anonymized or deleted',
      },
      blockchain: {
        notice: 'Blockchain data is permanently immutable and cannot be deleted. This is a technical limitation of blockchain technology and is noted as an exception under GDPR Article 17(3).',
      },
      contact: {
        email: 'privacy@example.com',
        dpo: 'Data Protection Officer',
      },
    },
  });
});

/**
 * GET /api/compliance/consent-types
 * Get available consent types
 */
router.get('/consent-types', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    consentTypes: Object.values(ConsentType).map((type) => ({
      type,
      description: getConsentDescription(type),
      required: isConsentRequired(type),
    })),
  });
});

/**
 * Helper function to get consent descriptions
 */
function getConsentDescription(type: ConsentType): string {
  const descriptions: Record<ConsentType, string> = {
    [ConsentType.WALLET_GENERATION]: 'Automatic wallet generation upon SSO authentication',
    [ConsentType.PRIVATE_KEY_STORAGE]: 'Server-side encrypted storage of private keys',
    [ConsentType.DATA_PROCESSING]: 'General data processing for platform functionality',
    [ConsentType.ANALYTICS]: 'Anonymous usage analytics for platform improvement',
    [ConsentType.NOTIFICATIONS]: 'Email and push notifications',
    [ConsentType.THIRD_PARTY_SHARING]: 'Sharing data with third-party services',
  };
  return descriptions[type] || 'Unknown consent type';
}

/**
 * Helper function to determine if consent is required
 */
function isConsentRequired(type: ConsentType): boolean {
  const required = [
    ConsentType.WALLET_GENERATION,
    ConsentType.PRIVATE_KEY_STORAGE,
    ConsentType.DATA_PROCESSING,
  ];
  return required.includes(type);
}

export default router;
