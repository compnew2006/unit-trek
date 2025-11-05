import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDebounce } from '../useDebounce';
import { renderHook, waitFor } from '@testing-library/react';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should reset timer on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'change1' });
    vi.advanceTimersByTime(200);
    rerender({ value: 'change2' });
    vi.advanceTimersByTime(200);
    rerender({ value: 'change3' });

    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('change3');
    });
  });
});

