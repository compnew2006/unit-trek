import { useState, useCallback } from 'react';

/**
 * Custom hook for managing bulk selection of items
 * 
 * Provides functionality to select/deselect individual items or all items,
 * with efficient state management using Set for O(1) lookup performance
 * 
 * @template T - Type of items that must have an 'id' property
 * @param {T[]} items - Array of items to manage selection for
 * @returns {Object} Selection state and control functions
 * @property {Set<string>} selectedIds - Set of selected item IDs
 * @property {number} selectedCount - Number of selected items
 * @property {Function} toggleSelection - Toggle selection for a single item
 * @property {Function} toggleAll - Toggle selection for all items
 * @property {Function} clearSelection - Clear all selections
 * @property {Function} isSelected - Check if an item is selected
 * @property {boolean} isAllSelected - Whether all items are selected
 * @property {boolean} isSomeSelected - Whether some (but not all) items are selected
 * @example
 * ```tsx
 * const { selectedIds, toggleSelection, toggleAll, isSelected } = useBulkSelection(items);
 * 
 * // Toggle single item
 * toggleSelection('item-id-1');
 * 
 * // Toggle all items
 * toggleAll();
 * 
 * // Check if item is selected
 * if (isSelected('item-id-1')) {
 *   // Handle selected item
 * }
 * ```
 */
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  }, [items, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = selectedIds.size > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}

