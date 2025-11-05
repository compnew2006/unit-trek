/**
 * Performance monitoring utilities
 * Tracks API response times, bundle size, and user experience metrics
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'api' | 'bundle' | 'render' | 'custom';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiTimes: Map<string, number[]> = new Map();
  private backendUrl: string | null = null;
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Initialize performance monitoring
   */
  init(options: { backendUrl?: string } = {}) {
    const { backendUrl } = options;
    
    this.backendUrl = backendUrl 
      ? `${backendUrl}/api/performance`
      : import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/api/performance`
        : null;

    // Track bundle size
    if (typeof window !== 'undefined' && window.performance) {
      this.trackBundleSize();
    }

    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        this.trackPageLoad();
      });
    }
  }

  /**
   * Track API response time
   */
  trackApiCall(endpoint: string, duration: number, status?: number) {
    const metric: PerformanceMetric = {
      name: `api.${endpoint}`,
      value: duration,
      timestamp: Date.now(),
      type: 'api',
      metadata: {
        endpoint,
        status,
      },
    };

    this.addMetric(metric);

    // Track per-endpoint statistics
    if (!this.apiTimes.has(endpoint)) {
      this.apiTimes.set(endpoint, []);
    }
    const times = this.apiTimes.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 100 measurements per endpoint
    if (times.length > 100) {
      times.shift();
    }

    // Log slow API calls (> 2 seconds)
    if (duration > 2000) {
      logger.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Track bundle size
   */
  trackBundleSize() {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const scripts = resources.filter(r => r.initiatorType === 'script');
    
    let totalSize = 0;
    scripts.forEach(script => {
      if (script.transferSize) {
        totalSize += script.transferSize;
      }
    });

    this.addMetric({
      name: 'bundle.size',
      value: totalSize,
      timestamp: Date.now(),
      type: 'bundle',
      metadata: {
        scriptCount: scripts.length,
      },
    });

    // Log bundle size
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    logger.debug(`Bundle size: ${sizeMB} MB`);
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        'performance.domContentLoaded': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        'performance.load': navigation.loadEventEnd - navigation.loadEventStart,
        'performance.firstPaint': this.getFirstPaint(),
        'performance.firstContentfulPaint': this.getFirstContentfulPaint(),
      };

      Object.entries(metrics).forEach(([name, value]) => {
        if (value > 0) {
          this.addMetric({
            name,
            value,
            timestamp: Date.now(),
            type: 'render',
          });
        }
      });
    }
  }

  /**
   * Get First Paint time
   */
  private getFirstPaint(): number {
    const paint = performance.getEntriesByType('paint').find(
      entry => entry.name === 'first-paint'
    );
    return paint ? paint.startTime : 0;
  }

  /**
   * Get First Contentful Paint time
   */
  private getFirstContentfulPaint(): number {
    const paint = performance.getEntriesByType('paint').find(
      entry => entry.name === 'first-contentful-paint'
    );
    return paint ? paint.startTime : 0;
  }

  /**
   * Track custom metric
   */
  trackCustom(name: string, value: number, metadata?: Record<string, any>) {
    this.addMetric({
      name: `custom.${name}`,
      value,
      timestamp: Date.now(),
      type: 'custom',
      metadata,
    });
  }

  /**
   * Get API statistics
   */
  getApiStats(endpoint?: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    if (endpoint) {
      const times = this.apiTimes.get(endpoint) || [];
      if (times.length === 0) {
        return { average: 0, min: 0, max: 0, count: 0 };
      }
      return {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length,
      };
    }

    // Overall stats
    const allTimes = Array.from(this.apiTimes.values()).flat();
    if (allTimes.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }
    return {
      average: allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
      min: Math.min(...allTimes),
      max: Math.max(...allTimes),
      count: allTimes.length,
    };
  }

  /**
   * Send metrics to backend
   */
  async sendMetrics() {
    if (!this.backendUrl || this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = []; // Clear after sending

    try {
      // Get auth token if available
      const token = localStorage.getItem('auth_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now(),
        }),
      });

      // Only log error if not 401 (unauthorized is expected if not logged in)
      if (!response.ok && response.status !== 401) {
        logger.error('Failed to send performance metrics', new Error(`HTTP ${response.status}`));
        // Re-add metrics if send failed
        this.metrics.unshift(...metricsToSend);
      }
    } catch (error) {
      // Silently fail - performance monitoring should not break the app
      // Only log in development
      if (import.meta.env.DEV) {
        logger.error('Failed to send performance metrics', error instanceof Error ? error : new Error(String(error)));
      }
      // Re-add metrics if send failed
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Add metric
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Auto-send metrics every 30 seconds (batch)
    if (this.metrics.length % 10 === 0) {
      setTimeout(() => this.sendMetrics(), 30000);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize
if (typeof window !== 'undefined') {
  performanceMonitor.init({
    backendUrl: import.meta.env.VITE_API_URL?.replace('/api', ''),
  });

  // Send metrics periodically
  setInterval(() => {
    performanceMonitor.sendMetrics();
  }, 60000); // Every minute
}

