import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../../utils/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimiter.clearAll();
  });

  it('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.checkLimit('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 10; i++) {
      rateLimiter.checkLimit('test-key', {
        maxRequests: 10,
        windowMs: 60000,
      });
    }

    const result = rateLimiter.checkLimit('test-key', {
      maxRequests: 10,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeDefined();
  });

  it('should reset limit for different keys', () => {
    rateLimiter.checkLimit('key1', { maxRequests: 5, windowMs: 60000 });
    rateLimiter.checkLimit('key2', { maxRequests: 5, windowMs: 60000 });

    const result1 = rateLimiter.checkLimit('key1', { maxRequests: 5, windowMs: 60000 });
    const result2 = rateLimiter.checkLimit('key2', { maxRequests: 5, windowMs: 60000 });

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });

  it('should reset limit when reset is called', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit('test-key', { maxRequests: 5, windowMs: 60000 });
    }

    rateLimiter.reset('test-key');

    const result = rateLimiter.checkLimit('test-key', {
      maxRequests: 5,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
  });
});

