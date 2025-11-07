import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
  extractTokenFromHeader,
} from '../utils/jwt';
import {
  verifyWalletSignature,
  generateNonce,
  createLoginMessage,
  validateLoginMessage,
  isValidAptosAddress,
  SignatureVerificationRequest,
} from '../utils/wallet';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for login attempts
 */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please try again in 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * In-memory nonce storage (in production, use Redis)
 * Maps address -> { nonce, timestamp }
 */
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

/**
 * Clean up expired nonces (older than 10 minutes)
 */
setInterval(() => {
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes

  for (const [address, data] of nonceStore.entries()) {
    if (now - data.timestamp > expiryTime) {
      nonceStore.delete(address);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * POST /api/auth/nonce
 * Request a nonce for wallet signature
 */
router.post('/nonce', authLimiter, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    // Validate address
    if (!address || !isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
        message: 'Please provide a valid Aptos address',
      });
    }

    // Generate nonce
    const nonce = generateNonce();
    const timestamp = Date.now();

    // Store nonce
    nonceStore.set(address.toLowerCase(), { nonce, timestamp });

    // Create login message
    const message = createLoginMessage(address, nonce);

    logger.info('Nonce generated', { address });

    res.json({
      success: true,
      data: {
        nonce,
        message,
        address,
      },
    });
  } catch (error) {
    logger.error('Failed to generate nonce', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate nonce',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with wallet signature
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const {
      address,
      message,
      signature,
      publicKey,
    }: SignatureVerificationRequest = req.body;

    // Validate inputs
    if (!address || !message || !signature || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide address, message, signature, and publicKey',
      });
    }

    // Validate address format
    if (!isValidAptosAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address',
        message: 'Please provide a valid Aptos address',
      });
    }

    // Get stored nonce
    const normalizedAddress = address.toLowerCase();
    const storedData = nonceStore.get(normalizedAddress);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'Nonce not found',
        message: 'Please request a nonce first',
      });
    }

    // Validate message
    if (!validateLoginMessage(message, storedData.nonce)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message',
        message: 'Login message is invalid or expired',
      });
    }

    // Verify signature
    const isValid = await verifyWalletSignature({
      address,
      message,
      signature,
      publicKey,
      nonce: storedData.nonce,
    });

    if (!isValid) {
      logger.warn('Invalid signature attempt', { address });
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
        message: 'Signature verification failed',
      });
    }

    // Delete used nonce
    nonceStore.delete(normalizedAddress);

    // Get or create user
    let users = await query(
      'SELECT address, role, display_name, email FROM users WHERE address = $1',
      [address]
    );

    let user;
    if (users.length === 0) {
      // Create new user with 'member' role
      await query(
        'INSERT INTO users (address, role) VALUES ($1, $2)',
        [address, 'member']
      );

      user = {
        address,
        role: 'member',
        display_name: null,
        email: null,
      };

      logger.info('New user registered', { address });
    } else {
      user = users[0];
      logger.info('User logged in', { address, role: user.role });
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user.address, user.role);

    res.json({
      success: true,
      data: {
        user: {
          address: user.address,
          role: user.role,
          displayName: user.display_name,
          email: user.email,
        },
        ...tokens,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to authenticate',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', authLimiter, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Please provide a refresh token',
      });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: error instanceof Error ? error.message : 'Token verification failed',
      });
    }

    // Get current user role
    const users = await query(
      'SELECT address, role FROM users WHERE address = $1',
      [payload.address]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User no longer exists',
      });
    }

    const user = users[0];

    // Generate new access token
    const accessToken = generateAccessToken(user.address, user.role);

    logger.info('Token refreshed', { address: user.address });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh token',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token validity
 */
router.post('/verify', authLimiter, async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization) || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing token',
        message: 'Please provide a token',
      });
    }

    // Try to verify using the auth middleware logic
    const { verifyAccessToken } = await import('../utils/jwt');

    try {
      const payload = verifyAccessToken(token);

      // Verify user still exists
      const users = await query(
        'SELECT address, role FROM users WHERE address = $1',
        [payload.address]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'User not found',
        });
      }

      const user = users[0];

      // Check if role matches
      if (user.role !== payload.role) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'User role has changed',
        });
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            address: user.address,
            role: user.role,
          },
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error instanceof Error ? error.message : 'Token verification failed',
      });
    }
  } catch (error) {
    logger.error('Token verification error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify token',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    // Get full user details
    const users = await query(
      'SELECT address, role, display_name, email, created_at FROM users WHERE address = $1',
      [req.user.address]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        user: {
          address: user.address,
          role: user.role,
          displayName: user.display_name,
          email: user.email,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get user info', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user info',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const { displayName, email } = req.body;

    // Validate inputs
    if (!displayName && !email) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Please provide displayName or email to update',
      });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (displayName) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(displayName);
    }

    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email',
          message: 'Please provide a valid email address',
        });
      }
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    values.push(req.user.address);

    // Update user
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE address = $${paramIndex}`,
      values
    );

    // Get updated user
    const users = await query(
      'SELECT address, role, display_name, email FROM users WHERE address = $1',
      [req.user.address]
    );

    logger.info('User profile updated', { address: req.user.address });

    res.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    logger.error('Failed to update profile', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token deletion)
 */
router.post('/logout', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a stateless JWT system, logout is primarily client-side
    // The client should delete the tokens

    logger.info('User logged out', { address: req.user?.address });

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to logout',
    });
  }
});

export default router;
