/**
 * Client-side rate limiting utility
 * Prevents spam requests and implements exponential backoff
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private readonly defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please try again later.',
  };

  /**
   * Check if a request is allowed
   */
  checkLimit(key: string, config?: Partial<RateLimitConfig>): {
    allowed: boolean;
    message?: string;
    retryAfter?: number;
  } {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const record = this.requests.get(key);

    // No previous requests or window expired
    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      });
      return { allowed: true };
    }

    // Within window, check count
    if (record.count < finalConfig.maxRequests) {
      record.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      message: finalConfig.message,
      retryAfter,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Clean up expired records
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Auto cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

export { rateLimiter, RateLimitConfig };

/**
 * Hook for rate limiting in React components
 */
export function useRateLimit(key: string, config?: Partial<RateLimitConfig>) {
  return {
    checkLimit: () => rateLimiter.checkLimit(key, config),
    reset: () => rateLimiter.reset(key),
  };
}

/**
 * Decorator for rate limiting async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  config?: Partial<RateLimitConfig>
): T {
  return (async (...args: any[]) => {
    const result = rateLimiter.checkLimit(key, config);
    
    if (!result.allowed) {
      throw new Error(result.message || 'Rate limit exceeded');
    }
    
    return fn(...args);
  }) as T;
}

