import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { query } from '../config/database';

/**
 * Extended Express Request with authenticated user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    role: string;
  };
}

/**
 * User role enum matching Move contract roles
 */
export enum UserRole {
  ADMIN = 'admin',
  ADVISOR = 'advisor',
  PRESIDENT = 'president',
  VICE_PRESIDENT = 'vice_president',
  EBOARD_MEMBER = 'eboard_member',
  MEMBER = 'member',
}

/**
 * Role weights matching Move contract
 */
export const ROLE_WEIGHTS: Record<string, number> = {
  [UserRole.ADMIN]: 100, // Special admin weight
  [UserRole.ADVISOR]: 3,
  [UserRole.PRESIDENT]: 2,
  [UserRole.VICE_PRESIDENT]: 2,
  [UserRole.EBOARD_MEMBER]: 2,
  [UserRole.MEMBER]: 1,
};

/**
 * Authentication middleware - Verifies JWT token
 * Attaches user info to request if valid
 */
export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      return;
    }

    // Verify the token
    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Invalid token',
      });
      return;
    }

    // Verify user exists in database and role matches
    const users = await query(
      'SELECT address, role FROM users WHERE address = $1',
      [payload.address]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    const user = users[0];

    // Verify role matches (prevent token reuse after role change)
    if (user.role !== payload.role) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User role has changed. Please login again.',
      });
      return;
    }

    // Attach user to request
    req.user = {
      address: user.address,
      role: user.role,
    };

    logger.debug('User authenticated', {
      address: user.address,
      role: user.role,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error('Authentication error', { error, path: req.path });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to authenticate',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Try to verify token
    try {
      const payload = verifyAccessToken(token);

      // Verify user exists
      const users = await query(
        'SELECT address, role FROM users WHERE address = $1',
        [payload.address]
      );

      if (users.length > 0 && users[0].role === payload.role) {
        req.user = {
          address: users[0].address,
          role: users[0].role,
        };
      }
    } catch {
      // Invalid token, continue without authentication
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error', { error });
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific role(s) to access endpoint
 * @param allowedRoles - Array of roles allowed to access the endpoint
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        logger.warn('Access denied - insufficient permissions', {
          address: req.user.address,
          role: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredRoles: allowedRoles,
          userRole: req.user.role,
        });
        return;
      }

      logger.debug('Role authorization successful', {
        address: req.user.address,
        role: req.user.role,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.error('Role authorization error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to authorize',
      });
    }
  };
};

/**
 * Minimum role weight authorization middleware
 * Requires minimum role weight to access endpoint
 * @param minWeight - Minimum role weight required
 */
export const requireMinWeight = (minWeight: number) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const userWeight = ROLE_WEIGHTS[req.user.role] || 0;

      if (userWeight < minWeight) {
        logger.warn('Access denied - insufficient weight', {
          address: req.user.address,
          role: req.user.role,
          userWeight,
          requiredWeight: minWeight,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredWeight: minWeight,
          userWeight,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Weight authorization error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to authorize',
      });
    }
  };
};

/**
 * Wallet ownership verification middleware
 * Ensures the authenticated user matches a wallet address parameter
 * @param paramName - Name of the route parameter containing the address (default: 'address')
 */
export const requireWalletOwnership = (paramName: string = 'address') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const targetAddress = req.params[paramName] || req.body[paramName];

      if (!targetAddress) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: `Missing ${paramName} parameter`,
        });
        return;
      }

      // Normalize addresses for comparison (case-insensitive)
      const userAddress = req.user.address.toLowerCase();
      const targetAddressNormalized = targetAddress.toLowerCase();

      if (userAddress !== targetAddressNormalized) {
        logger.warn('Access denied - wallet ownership mismatch', {
          userAddress,
          targetAddress: targetAddressNormalized,
          path: req.path,
        });

        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own resources',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Wallet ownership verification error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to verify wallet ownership',
      });
    }
  };
};

/**
 * Admin-only middleware
 * Shorthand for requireRole([UserRole.ADMIN])
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * E-board or higher middleware
 * Allows advisors, president, vice president, and e-board members
 */
export const requireEboard = requireRole([
  UserRole.ADMIN,
  UserRole.ADVISOR,
  UserRole.PRESIDENT,
  UserRole.VICE_PRESIDENT,
  UserRole.EBOARD_MEMBER,
]);

/**
 * Leadership middleware
 * Allows advisors, president, and vice president
 */
export const requireLeadership = requireRole([
  UserRole.ADMIN,
  UserRole.ADVISOR,
  UserRole.PRESIDENT,
  UserRole.VICE_PRESIDENT,
]);
