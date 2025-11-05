/**
 * API Client for backend server communication
 * 
 * @module apiClient
 * @description Provides a centralized API client with authentication, error handling,
 * retry logic, rate limiting, and automatic token refresh capabilities.
 * 
 * Features:
 * - JWT token management (access and refresh tokens)
 * - Automatic token refresh on 401 errors
 * - Request queuing during token refresh
 * - Rate limiting (client-side)
 * - Input sanitization
 * - Performance monitoring
 * - Error tracking
 */

// API Client for backend server (replaces Supabase)
import { rateLimiter } from '../utils/rateLimiter';
import { performanceMonitor } from '../utils/performanceMonitor';
import { logger } from '../utils/logger';
import { sanitizeObject } from '../utils/sanitize';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug: Log API URL in development
logger.debug('API URL configured', { 
  apiUrl: API_URL, 
  viteApiUrl: import.meta.env.VITE_API_URL 
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Custom error class for API errors
 * Extends the native Error class with HTTP status information
 * 
 * @class ApiError
 * @extends Error
 * @property {number} [status] - HTTP status code
 * @property {string} [statusText] - HTTP status text
 * @property {any} [data] - Additional error data
 * @example
 * ```ts
 * throw new ApiError('Item not found', 404, 'Not Found', { itemId: '123' });
 * ```
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get authentication token from localStorage
 * 
 * @returns {string | null} The access token or null if not found
 */
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Set authentication token in localStorage
 * 
 * @param {string} token - The access token to store
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove authentication tokens from localStorage
 * Used during logout or when tokens are invalid
 */
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Get refresh token from localStorage
 * 
 * @returns {string | null} The refresh token or null if not found
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * Set refresh token in localStorage
 * 
 * @param {string} token - The refresh token to store
 */
export const setRefreshToken = (token: string) => {
  localStorage.setItem('refresh_token', token);
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh event
 * Used to queue requests that are waiting for token refresh
 * 
 * @param {Function} callback - Callback function to call when token is refreshed
 * @private
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 * 
 * @param {string} token - The new access token
 * @private
 */
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Refresh access token using refresh token
 * Automatically handles token rotation and updates localStorage
 * 
 * @returns {Promise<string>} The new access token
 * @throws {Error} If refresh token is not available or refresh fails
 * @example
 * ```ts
 * try {
 *   const newToken = await refreshAccessToken();
 *   // Use newToken for authenticated requests
 * } catch (error) {
 *   // Handle refresh failure (redirect to login)
 * }
 * ```
 */
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include cookies for httpOnly token support
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    if (data.token) {
      setAuthToken(data.token);
    }
    
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }

    return data.token;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    removeAuthToken();
    if (!window.location.pathname.includes('/auth')) {
      window.location.href = '/auth';
    }
    throw error;
  }
};

// Retry function with exponential backoff
const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    // Don't retry on authentication errors or client errors (4xx)
    if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
      throw error;
    }

    // Don't retry if no retries left
    if (retries <= 0) {
      throw error;
    }

    // Wait before retrying with exponential backoff
    await delay(delayMs * (MAX_RETRIES - retries + 1));

    // Retry
    return retryRequest(fn, retries - 1, delayMs);
  }
};

// API request helper with retry logic and improved error handling
const request = async (endpoint: string, options: RequestInit = {}, retryOnRefresh = true): Promise<unknown> => {
  const makeRequest = async () => {
    // Rate limiting check
    const rateLimit = rateLimiter.checkLimit(`api:${endpoint}`, {
      maxRequests: 30,
      windowMs: 60000, // 30 requests per minute
    });
    
    if (!rateLimit.allowed) {
      throw new ApiError(
        rateLimit.message || 'Too many requests',
        429,
        'Too Many Requests'
      );
    }

    const token = getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const startTime = performance.now();
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Include cookies for httpOnly token support
        headers,
      });
      const duration = performance.now() - startTime;

      // Track API performance
      performanceMonitor.trackApiCall(endpoint, duration, response.status);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryOnRefresh && endpoint !== '/auth/refresh') {
        logger.debug('Access token expired, attempting refresh', { endpoint });
        
        // If already refreshing, wait for it to complete
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken: string) => {
              // Retry the original request with new token
              const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
              fetch(`${API_URL}${endpoint}`, { 
                ...options, 
                credentials: 'include', // Include cookies for httpOnly token support
                headers: newHeaders 
              })
                .then(res => res.json())
                .then(resolve)
                .catch(reject);
            });
          });
        }

        // Start token refresh
        isRefreshing = true;
        
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          // Retry original request with new token
          logger.debug('Token refreshed, retrying request', { endpoint });
          return request(endpoint, options, false); // Don't retry again
        } catch (refreshError) {
          isRefreshing = false;
          onTokenRefreshed(''); // Clear subscribers
          
          // If refresh fails, clear tokens and redirect
          removeAuthToken();
          if (!window.location.pathname.includes('/auth')) {
            window.location.href = '/auth';
          }
          
          throw new ApiError(
            'Your session has expired. Please log in again.',
            response.status,
            response.statusText
          );
        }
      }
      
      // Handle 401 after refresh attempt failed
      if (response.status === 401) {
        removeAuthToken();
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
        throw new ApiError(
          'Your session has expired. Please log in again.',
          response.status,
          response.statusText
        );
      }

      // Handle 429 Too Many Requests - Don't retry
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({ error: 'Too many requests' }));
        const retryAfter = response.headers.get('Retry-After') || response.headers.get('X-RateLimit-Reset');
        throw new ApiError(
          errorData.error || 'Too many requests from this IP, please try again later.',
          response.status,
          response.statusText,
          { retryAfter, ...errorData }
        );
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new ApiError(
          'You do not have permission to perform this action.',
          response.status,
          response.statusText
        );
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        throw new ApiError(
          'The requested resource was not found.',
          response.status,
          response.statusText
        );
      }

      // Handle 500 Internal Server Error
      if (response.status >= 500) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new ApiError(
          errorData.error || 'Server error. Please try again later.',
          response.status,
          response.statusText,
          errorData
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new ApiError(
          errorData.error || `HTTP error! status: ${response.status}`,
          response.status,
          response.statusText,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // For DELETE requests, return success if status is 200-299
        if (response.ok) {
          return { success: true };
        }
        return null;
      }

      return response.json();
    } catch (error: unknown) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new ApiError(
          `Cannot connect to server. Please make sure the backend server is running on ${API_URL.replace('/api', '')}`,
          0,
          'Network Error'
        );
      }

      // Wrap unknown errors
      throw new ApiError(
        error.message || 'An unexpected error occurred',
        undefined,
        undefined,
        error
      );
    }
  };

  // Retry the request if it fails
  return retryRequest(makeRequest);
};

// Auth API
export const authApi = {
  register: async (email: string, password: string, username: string) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
      }
    }
    removeAuthToken();
  },
  
  refresh: async () => {
    return refreshAccessToken();
  },
};

// Users API
export const usersApi = {
  getAll: () => request('/users'),
  update: (id: string, data: Record<string, unknown>) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Warehouses API
export const warehousesApi = {
  getAll: () => request('/warehouses'),
  getById: (id: string) => request(`/warehouses/${id}`),
  create: (data: Record<string, unknown>) => request('/warehouses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Record<string, unknown>) => request(`/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request(`/warehouses/${id}`, {
    method: 'DELETE',
  }),
};

// Items API
export const itemsApi = {
  getAll: () => request('/items'),
  getByWarehouse: (warehouseId: string) => request(`/items/warehouse/${warehouseId}`),
  getById: (id: string) => request(`/items/${id}`),
  create: (data: Record<string, unknown>) => request('/items', {
    method: 'POST',
    body: JSON.stringify(sanitizeObject(data)),
  }),
  update: (id: string, data: Record<string, unknown>) => request(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizeObject(data)),
  }),
  delete: (id: string) => request(`/items/${id}`, {
    method: 'DELETE',
  }),
  bulkCreate: (items: Record<string, unknown>[]) => request('/items/bulk', {
    method: 'POST',
    body: JSON.stringify({ items: items.map(sanitizeObject) }),
  }),
};

// Movements API
export const movementsApi = {
  record: (itemId: string, type: string, quantity: number, notes?: string) =>
    request('/movements', {
      method: 'POST',
      body: JSON.stringify({ itemId, type, quantity, notes }),
    }),
};

// History API
export const historyApi = {
  getAll: () => request('/history'),
  getByWarehouse: (warehouseId: string) => request(`/history/warehouse/${warehouseId}`),
  getByItem: (itemId: string) => request(`/history/item/${itemId}`),
};

// Permissions API (stored in constants, not in DB)
export const permissionsApi = {
  getAll: async () => {
    // Permissions are defined in constants
    const { DEFAULT_PERMISSIONS } = await import('../constants');
    return DEFAULT_PERMISSIONS;
  },
};
