/**
 * Authentication and Authorization Utilities for Next.js API Routes
 * Adapted from Express middleware for serverless compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { rawQuery } from '../db/client';

/**
 * Authenticated user info attached to request
 */
export interface AuthenticatedUser {
  address: string;
  role: string;
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
 * Verify JWT token and return authenticated user
 * @param req - Next.js request object
 * @returns Authenticated user info or null if invalid
 */
export async function verifyAuth(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return null;
    }

    // Verify the token
    let payload: JwtPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      return null;
    }

    // Verify user exists in database and role matches
    const users = await rawQuery(
      'SELECT address, role FROM users WHERE address = $1',
      [payload.address]
    );

    if (users.length === 0) {
      console.error('[Auth] User not found:', payload.address);
      return null;
    }

    const user = users[0];

    // Verify role matches (prevent token reuse after role change)
    if (user.role !== payload.role) {
      console.error('[Auth] Role mismatch:', { expected: user.role, got: payload.role });
      return null;
    }

    return {
      address: user.address,
      role: user.role,
    };
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns authenticated user or error response
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const user = await verifyAuth(req);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role as UserRole);
}

/**
 * Check if user meets minimum role weight
 */
export function hasMinWeight(user: AuthenticatedUser, minWeight: number): boolean {
  const userWeight = ROLE_WEIGHTS[user.role] || 0;
  return userWeight >= minWeight;
}

/**
 * Require specific role(s) for an API route
 * @param user - Authenticated user
 * @param allowedRoles - Array of allowed roles
 * @returns true if authorized, NextResponse with error if not
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): true | NextResponse {
  if (!hasRole(user, allowedRoles)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: user.role,
      },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Require minimum role weight for an API route
 */
export function requireMinWeight(
  user: AuthenticatedUser,
  minWeight: number
): true | NextResponse {
  const userWeight = ROLE_WEIGHTS[user.role] || 0;

  if (userWeight < minWeight) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
        requiredWeight: minWeight,
        userWeight,
      },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Verify wallet ownership
 * Ensures the authenticated user matches a wallet address
 */
export function requireWalletOwnership(
  user: AuthenticatedUser,
  targetAddress: string
): true | NextResponse {
  const userAddress = user.address.toLowerCase();
  const targetAddressNormalized = targetAddress.toLowerCase();

  if (userAddress !== targetAddressNormalized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own resources',
      },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Shorthand role checkers
 */
export const ADMIN_ROLES = [UserRole.ADMIN];
export const EBOARD_ROLES = [
  UserRole.ADMIN,
  UserRole.ADVISOR,
  UserRole.PRESIDENT,
  UserRole.VICE_PRESIDENT,
  UserRole.EBOARD_MEMBER,
];
export const LEADERSHIP_ROLES = [
  UserRole.ADMIN,
  UserRole.ADVISOR,
  UserRole.PRESIDENT,
  UserRole.VICE_PRESIDENT,
];
