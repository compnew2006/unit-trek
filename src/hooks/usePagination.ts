import { useState, useMemo } from 'react';

/**
 * Props for usePagination hook
 * @template T - The type of items in the data array
 */
interface UsePaginationProps<T> {
  /** Array of data items to paginate */
  data: T[];
  /** Number of items per page (default: 10) */
  itemsPerPage?: number;
}

/**
 * Return type for usePagination hook
 * @template T - The type of items in the data array
 */
interface UsePaginationReturn<T> {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items for the current page */
  paginatedData: T[];
  /** Function to set current page */
  setCurrentPage: (page: number) => void;
  /** Navigate to next page */
  goToNextPage: () => void;
  /** Navigate to previous page */
  goToPreviousPage: () => void;
  /** Navigate to first page */
  goToFirstPage: () => void;
  /** Navigate to last page */
  goToLastPage: () => void;
  /** Whether navigation to next page is possible */
  canGoNext: boolean;
  /** Whether navigation to previous page is possible */
  canGoPrevious: boolean;
  /** Start index (1-indexed) of current page items */
  startIndex: number;
  /** End index (1-indexed) of current page items */
  endIndex: number;
  /** Total number of items */
  totalItems: number;
}

/**
 * Custom hook for paginating data
 * 
 * Provides pagination logic with navigation helpers and computed values
 * 
 * @template T - The type of items in the data array
 * @param {UsePaginationProps<T>} props - Pagination configuration
 * @returns {UsePaginationReturn<T>} Pagination state and controls
 * @example
 * ```tsx
 * const { paginatedData, currentPage, totalPages, goToNextPage } = usePagination({
 *   data: items,
 *   itemsPerPage: 20
 * });
 * ```
 */
export function usePagination<T>({
  data,
  itemsPerPage = 10,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  // Calculate 1-based indices for display
  const startIndex = data.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = data.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, data.length);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems: data.length,
  };
}

