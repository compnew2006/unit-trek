import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { query, queryOne, insert } from '../config/database.js';

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

interface RefreshTokenRecord {
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked?: boolean;
  revoked_at?: Date | null;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    payload,
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
};

/**
 * Generate refresh token (long-lived) and store in database
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  // Generate a random token
  const token = randomBytes(64).toString('hex');
  
  // Calculate expiry date
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresAt = new Date();
  
  // Parse expiry string (e.g., "7d", "30d", "1h")
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + value);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + value);
        break;
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
        break;
      case 's':
        expiresAt.setSeconds(expiresAt.getSeconds() + value);
        break;
    }
  } else {
    // Default to 7 days
    expiresAt.setDate(expiresAt.getDate() + 7);
  }
  
  // Store refresh token in database
  await insert(
    'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
    [userId, token, expiresAt]
  );
  
  return token;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenRecord> => {
  const refreshToken = await queryOne(
    'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = FALSE AND expires_at > NOW()',
    [token]
  ) as RefreshTokenRecord | null;
  
  if (!refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }
  
  return refreshToken;
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token = ?',
    [token]
  );
};

/**
 * Revoke all user's refresh tokens
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE user_id = ? AND revoked = FALSE',
    [userId]
  );
};

/**
 * Clean up expired tokens (can be run as a scheduled job)
 */
export const cleanupExpiredTokens = async (): Promise<unknown> => {
  const result = await query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR (revoked = TRUE AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))',
    []
  );
  return result;
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

