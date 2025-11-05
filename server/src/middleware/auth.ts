import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request type to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 * Supports both httpOnly cookies and Authorization header
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Try to get token from cookie first (httpOnly), then from Authorization header (backward compatibility)
  let token: string | undefined = req.cookies?.accessToken;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ error: 'JWT secret not configured' });
    return;
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    
    if (user && typeof user === 'object' && 'userId' in user) {
      req.user = {
        userId: user.userId as string,
        email: user.email as string,
        username: user.username as string,
      };
    }
    
    next();
  });
};

