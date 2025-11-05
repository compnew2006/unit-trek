import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkSelection } from '../useBulkSelection';

describe('useBulkSelection Hook', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  it('should initialize with no selections', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems));
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.hasSelection).toBe(false);
  });

  it('should toggle item selection', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems));

    act(() => {
      result.current.toggleItem('1');
    });

    expect(result.current.selectedItems).toEqual(['1']);
    expect(result.current.isSelected('1')).toBe(true);

    act(() => {
      result.current.toggleItem('1');
    });

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('should toggle all items', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems));

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.selectedItems).toEqual(['1', '2', '3']);
    expect(result.current.isAllSelected).toBe(true);

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems));

    act(() => {
      result.current.toggleItem('1');
      result.current.toggleItem('2');
    });

    expect(result.current.selectedItems).toHaveLength(2);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedItems).toEqual([]);
  });

  it('should calculate selection count correctly', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems));

    act(() => {
      result.current.toggleItem('1');
      result.current.toggleItem('2');
    });

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.hasSelection).toBe(true);
  });
});

