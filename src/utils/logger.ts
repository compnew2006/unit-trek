/**
 * Logger utility for application-wide logging
 * Replaces console.* statements with environment-aware logging
 * 
 * @module logger
 * @description Provides structured logging with different log levels
 * that respect NODE_ENV and only log in development mode (unless forced)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  private isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    // In production, send to error tracking service
    if (this.isProduction && typeof window !== 'undefined') {
      // Could send to error tracking service here
    }
  }

  /**
   * Log error message (always logged, even in production)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context };

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, errorContext);
    } else {
      // In production, send to error tracking service
      console.error(`[ERROR] ${message}`);
      if (typeof window !== 'undefined' && error instanceof Error) {
        // Import error tracker dynamically to avoid circular dependencies
        import('./errorTracker').then(({ errorTracker }) => {
          errorTracker.captureError(error, context);
        }).catch(() => {
          // Fallback if errorTracker fails
        });
      }
    }
  }

  /**
   * Log API request (development only)
   */
  apiRequest(method: string, url: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url}`, data || '');
    }
  }

  /**
   * Log API response (development only)
   */
  apiResponse(url: string, status: number, data?: unknown): void {
    if (this.isDevelopment) {
      const statusColor = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
      console.log(`${statusColor} [API] ${url} ${status}`, data || '');
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: LogContext) => logger.error(message, error, context),
  api: {
    request: (method: string, url: string, data?: unknown) => logger.apiRequest(method, url, data),
    response: (url: string, status: number, data?: unknown) => logger.apiResponse(url, status, data),
  },
};

