import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError, getToken, setAuthToken, removeAuthToken, api } from '../../services/apiClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should get token from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token');
      expect(getToken()).toBe('test-token');
    });

    it('should return null when no token', () => {
      expect(getToken()).toBe(null);
    });

    it('should set token in localStorage', () => {
      setAuthToken('new-token');
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('should remove tokens', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('refresh_token', 'refresh');
      removeAuthToken();
      expect(localStorage.getItem('auth_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
    });
  });

  describe('ApiError', () => {
    it('should create error with message', () => {
      const error = new ApiError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('should include status text and data', () => {
      const error = new ApiError('Error', 404, 'Not Found', { id: 1 });
      expect(error.statusText).toBe('Not Found');
      expect(error.data).toEqual({ id: 1 });
    });
  });

  describe('API Requests', () => {
    it('should make GET request', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await api.items.getAll();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(api.items.getAll()).rejects.toThrow();
    });

    it('should include authorization header when token exists', async () => {
      setAuthToken('test-token');
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await api.items.getAll();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(api.items.getAll()).rejects.toThrow();
    });
  });
});

