import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { WalletService } from '../services/walletService';
import { query } from '../config/database';

const router = Router();

/**
 * Rate limiter for webhook endpoints
 * More restrictive than regular API endpoints
 */
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many webhook requests',
    message: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook request interface
 */
interface CreateWalletWebhookRequest {
  auth0_id: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Verify webhook authentication
 * Checks Bearer token against BACKEND_WEBHOOK_SECRET
 */
const verifyWebhookAuth = (req: Request): boolean => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header', {
        hasHeader: !!authHeader,
        ip: req.ip,
      });
      return false;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const expectedSecret = process.env.BACKEND_WEBHOOK_SECRET;

    if (!expectedSecret) {
      logger.error('BACKEND_WEBHOOK_SECRET not configured');
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedSecret)
    );

    if (!isValid) {
      logger.warn('Invalid webhook secret', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Webhook authentication error', { error });
    return false;
  }
};

/**
 * Validate webhook request body
 */
const validateWebhookRequest = (body: any): body is CreateWalletWebhookRequest => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  // auth0_id is required
  if (!body.auth0_id || typeof body.auth0_id !== 'string' || body.auth0_id.trim().length === 0) {
    return false;
  }

  // email is optional but must be valid if provided
  if (body.email !== undefined) {
    if (typeof body.email !== 'string') {
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.email && !emailRegex.test(body.email)) {
      return false;
    }
  }

  // given_name and family_name are optional but must be strings if provided
  if (body.given_name !== undefined && typeof body.given_name !== 'string') {
    return false;
  }

  if (body.family_name !== undefined && typeof body.family_name !== 'string') {
    return false;
  }

  return true;
};

/**
 * POST /api/auth/webhook/create-wallet
 * Webhook endpoint called by Auth0 to create Aptos wallet for new users
 *
 * This endpoint:
 * 1. Verifies webhook authentication
 * 2. Validates request data
 * 3. Checks if user already exists
 * 4. Creates new Aptos wallet if needed
 * 5. Returns wallet address to Auth0
 *
 * Security:
 * - Rate limited to 100 requests/minute
 * - Requires Bearer token authentication
 * - Input validation and sanitization
 * - Audit logging for all operations
 */
router.post(
  '/create-wallet',
  webhookLimiter,
  async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      // Verify webhook authentication
      if (!verifyWebhookAuth(req)) {
        logger.warn('Unauthorized webhook request', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path,
        });

        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid webhook authentication',
        });
      }

      // Validate request body
      if (!validateWebhookRequest(req.body)) {
        logger.warn('Invalid webhook request body', {
          body: req.body,
          ip: req.ip,
        });

        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Missing or invalid required fields (auth0_id is required)',
        });
      }

      const {
        auth0_id,
        email,
        given_name,
        family_name,
      }: CreateWalletWebhookRequest = req.body;

      logger.info('Webhook: Create wallet request received', {
        auth0_id,
        email,
        hasGivenName: !!given_name,
        hasFamilyName: !!family_name,
      });

      // Check if user already exists with this Auth0 ID
      const existingUsers = await query(
        'SELECT address, wallet_public_key, email, sso_provider, sso_id FROM users WHERE sso_id = $1 AND sso_provider = $2',
        [auth0_id, 'google']
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];

        logger.info('Webhook: User already exists', {
          auth0_id,
          address: user.address,
          email: user.email,
        });

        return res.json({
          success: true,
          wallet_address: user.address,
          message: 'Wallet already exists',
          existing: true,
        });
      }

      // Create new wallet for user
      logger.info('Webhook: Creating new wallet', {
        auth0_id,
        email,
      });

      try {
        const result = await WalletService.createWalletForUser(
          auth0_id,
          'google', // SSO provider
          email,
          given_name,
          family_name
        );

        const duration = Date.now() - startTime;

        logger.info('Webhook: Wallet created successfully', {
          auth0_id,
          email,
          address: result.address,
          duration,
        });

        // Optionally fund the wallet on testnet
        if (process.env.APTOS_NETWORK === 'testnet' && process.env.AUTO_FUND_WALLETS === 'true') {
          try {
            const fundTxHash = await WalletService.fundWallet(result.address);
            if (fundTxHash) {
              logger.info('Webhook: Wallet funded', {
                address: result.address,
                txHash: fundTxHash,
              });
            }
          } catch (fundError) {
            // Log but don't fail the request if funding fails
            logger.warn('Webhook: Failed to fund wallet', {
              address: result.address,
              error: fundError,
            });
          }
        }

        return res.status(201).json({
          success: true,
          wallet_address: result.address,
          message: 'Wallet created successfully',
          existing: false,
        });
      } catch (walletError) {
        logger.error('Webhook: Wallet creation failed', {
          auth0_id,
          email,
          error: walletError,
          duration: Date.now() - startTime,
        });

        // Check for specific error types
        if (walletError instanceof Error) {
          if (walletError.message.includes('Wallet generation failed')) {
            return res.status(500).json({
              success: false,
              error: 'Wallet generation error',
              message: 'Failed to generate Aptos wallet',
            });
          }

          if (walletError.message.includes('Encryption')) {
            return res.status(500).json({
              success: false,
              error: 'Encryption error',
              message: 'Failed to encrypt wallet private key',
            });
          }

          if (walletError.message.includes('database') || walletError.message.includes('Database')) {
            return res.status(500).json({
              success: false,
              error: 'Database error',
              message: 'Failed to store wallet in database',
            });
          }
        }

        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'Failed to create wallet',
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Webhook: Unhandled error', {
        error,
        duration,
        body: req.body,
        ip: req.ip,
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      });
    }
  }
);

/**
 * GET /api/auth/webhook/health
 * Health check endpoint for webhook service
 */
router.get('/health', (req: Request, res: Response) => {
  const isConfigured = !!process.env.BACKEND_WEBHOOK_SECRET;

  return res.json({
    success: true,
    service: 'webhook',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
  });
});

export default router;
