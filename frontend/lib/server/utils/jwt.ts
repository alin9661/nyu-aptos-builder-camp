import jwt from 'jsonwebtoken';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
  address: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token payload interface
 */
export interface RefreshTokenPayload {
  address: string;
  iat: number;
  exp: number;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate an access token for a user
 * @param address - User's Aptos wallet address
 * @param role - User's role (admin, advisor, president, etc.)
 * @returns Signed JWT access token
 */
export const generateAccessToken = (address: string, role: string): string => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');
  return jwt.sign(
    { address, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a refresh token for a user
 * @param address - User's Aptos wallet address
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (address: string): string => {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET must be set');
  return jwt.sign(
    { address },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Generate both access and refresh tokens
 * @param address - User's Aptos wallet address
 * @param role - User's role
 * @returns Object containing both tokens
 */
export const generateTokenPair = (address: string, role: string): TokenPair => {
  return {
    accessToken: generateAccessToken(address, role),
    refreshToken: generateRefreshToken(address),
  };
};

/**
 * Verify and decode an access token
 * @param token - JWT access token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Failed to verify access token');
    }
  }
};

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded refresh token payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET must be set');
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Failed to verify refresh token');
    }
  }
};

/**
 * Extract JWT token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Extracted token or null if invalid format
 */
export const extractTokenFromHeader = (authHeader: string | undefined | null): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Decode a token without verification (use for debugging only)
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
