/**
 * Error tracking utilities
 * Supports Sentry integration and backend logging
 */

interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface SentryModule {
  init: (config: Record<string, unknown>) => void;
  captureException: (error: Error, options?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
  BrowserTracing: new () => unknown;
  Replay: new (config: Record<string, unknown>) => unknown;
}

class ErrorTracker {
  private sentryEnabled = false;
  private backendUrl: string | null = null;
  private sentryModule: SentryModule | null = null;

  /**
   * Initialize error tracking
   */
  async init(options: {
    sentryDsn?: string;
    backendUrl?: string;
    environment?: string;
  } = {}) {
    const { sentryDsn, backendUrl, environment = 'development' } = options;

    // Set backend URL for error logging
    if (backendUrl) {
      this.backendUrl = backendUrl;
    } else {
      this.backendUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/errors` 
        : null;
    }

    // Initialize Sentry if DSN provided (optional dependency)
    if (sentryDsn && typeof window !== 'undefined') {
      try {
        // Try to dynamically import Sentry (may not be installed)
        // Using eval to avoid Vite static analysis - Sentry is optional
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const importSentry = () => eval('import("@sentry/react")');
        const SentryModule = await importSentry().catch(() => null);
        
        if (SentryModule && SentryModule.init) {
          this.sentryModule = SentryModule;
          SentryModule.init({
            dsn: sentryDsn,
            environment,
            integrations: [
              new SentryModule.BrowserTracing(),
              new SentryModule.Replay({
                maskAllText: true,
                blockAllMedia: true,
              }),
            ],
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
          });
          this.sentryEnabled = true;
          // Use logger if available, otherwise minimal console
          if (import.meta.env.DEV) {
            console.log('✅ Sentry initialized');
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Sentry not available, using backend logging only');
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Sentry initialization failed:', error);
        }
      }
    }
  }

  /**
   * Capture error
   */
  async captureError(error: Error, context: ErrorContext = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    // Send to Sentry if enabled
    if (this.sentryEnabled && this.sentryModule && typeof window !== 'undefined') {
      try {
        this.sentryModule.captureException(error, {
          contexts: {
            custom: context,
          },
        });
      } catch (e) {
        console.warn('Failed to send to Sentry:', e);
      }
    }

    // Log to backend
    if (this.backendUrl) {
      try {
        await fetch(this.backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            level: 'error',
            ...errorInfo,
          }),
        });
      } catch (e) {
        // Only log in development, errors are already captured
        if (import.meta.env.DEV) {
          console.error('Failed to log error to backend:', e);
        }
      }
    }

    // Log to console in development only
    // In production, errors are sent to backend/error tracking service
  }

  /**
   * Capture message
   */
  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
    const messageInfo = {
      message,
      level,
      ...context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    // Send to Sentry if enabled
    if (this.sentryEnabled && this.sentryModule && typeof window !== 'undefined') {
      try {
        this.sentryModule.captureMessage(message, level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info');
      } catch (e) {
        console.warn('Failed to send to Sentry:', e);
      }
    }

    // Log to backend
    if (this.backendUrl) {
      try {
        await fetch(this.backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(messageInfo),
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to log message to backend:', e);
        }
      }
    }

    // Log to console in development only
    // In production, messages are sent to backend/error tracking service
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string) {
    if (this.sentryEnabled && this.sentryModule && typeof window !== 'undefined') {
      try {
        this.sentryModule.setUser({
          id: userId,
          email,
          username,
        });
      } catch (e) {
        // Ignore errors
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (this.sentryEnabled && this.sentryModule && typeof window !== 'undefined') {
      try {
        this.sentryModule.setUser(null);
      } catch (e) {
        // Ignore errors
      }
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Initialize with environment variables (async)
if (typeof window !== 'undefined') {
  // Initialize asynchronously to avoid blocking
  Promise.resolve().then(() => {
    errorTracker.init({
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      backendUrl: import.meta.env.VITE_API_URL?.replace('/api', ''),
      environment: import.meta.env.MODE || 'development',
    });
  });
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Ignore Chrome Extension message passing errors
    // These are common and not related to the application code
    if (event.message && event.message.includes('message channel closed')) {
      return; // Silently ignore extension-related errors
    }
    
    errorTracker.captureError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Ignore Chrome Extension message passing errors
    const errorMessage = event.reason?.message || String(event.reason || '');
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response')) {
      return; // Silently ignore extension-related errors
    }
    
    errorTracker.captureError(
      event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason)),
      {
        type: 'unhandledrejection',
      }
    );
  });
}


