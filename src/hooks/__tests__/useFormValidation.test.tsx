import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation Hook', () => {
  const mockRules = {
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!value.includes('@')) return 'Invalid email';
      return null;
    },
    password: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      return null;
    },
  };

  it('should validate on change', async () => {
    const { result } = renderHook(() => useFormValidation(mockRules));

    act(() => {
      result.current.handleChange('email', 'invalid');
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBe('Invalid email');
    });
  });

  it('should clear errors on valid input', async () => {
    const { result } = renderHook(() => useFormValidation(mockRules));

    act(() => {
      result.current.handleChange('email', 'invalid');
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
    });

    act(() => {
      result.current.handleChange('email', 'valid@example.com');
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBeNull();
    });
  });

  it('should validate all fields', async () => {
    const { result } = renderHook(() => useFormValidation(mockRules));

    act(() => {
      result.current.validateAll({
        email: '',
        password: '123',
      });
    });

    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();
    });
  });

  it('should return isValid status', async () => {
    const { result } = renderHook(() => useFormValidation(mockRules));

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });
  });
});

