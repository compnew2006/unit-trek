import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// More lenient limits in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Get IP address from request
 */
const getKeyGenerator = (req: Request): string => {
  return req.ip || (req as unknown as { connection?: { remoteAddress?: string } }).connection?.remoteAddress || 'unknown';
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP (production)
 * 1000 requests per 15 minutes per IP (development)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More lenient in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (only count errors)
  skipSuccessfulRequests: false,
  // Use IP address from request
  keyGenerator: getKeyGenerator,
  // Custom handler for when limit is exceeded
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: getKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Moderate rate limiter for write operations (POST, PUT, DELETE)
 * 50 requests per 15 minutes per IP (production)
 * 500 requests per 15 minutes per IP (development)
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 50, // More lenient in development
  message: {
    error: 'Too many write operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: getKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many write operations, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Per-user rate limiter (applied after authentication)
 * 200 requests per 15 minutes per user
 */
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.userId || getKeyGenerator(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

