import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination Hook', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  it('should initialize with first page', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedData).toHaveLength(10);
  });

  it('should paginate data correctly', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.paginatedData[0].id).toBe(0);
    expect(result.current.paginatedData[9].id).toBe(9);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData[0].id).toBe(10);
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect(result.current.paginatedData).toHaveLength(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('should calculate correct total pages', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));
    expect(result.current.totalPages).toBe(5);

    const { result: result2 } = renderHook(() => usePagination(mockData, 25));
    expect(result2.current.totalPages).toBe(2);
  });

  it('should handle page changes', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.setCurrentPage(5);
    });

    expect(result.current.currentPage).toBe(5);
    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.paginatedData[0].id).toBe(40);
  });

  it('should not exceed total pages', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.setCurrentPage(10);
    });

    expect(result.current.currentPage).toBe(5); // Should cap at total pages
  });
});

