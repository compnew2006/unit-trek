/**
 * Options for optimistic update execution
 * @template T - Type of the result data
 */
interface OptimisticUpdateOptions<T> {
  /** Callback executed on successful API call */
  onSuccess?: (data: T) => void;
  /** Callback executed on error */
  onError?: (error: Error) => void;
  /** Success message to display in toast */
  successMessage?: string;
  /** Custom error message to display in toast */
  errorMessage?: string;
}

/**
 * Custom hook for optimistic UI updates
 * 
 * Provides functionality to update UI immediately and rollback on error.
 * This improves perceived performance by showing changes instantly while
 * the API call is in progress.
 * 
 * @template T - Type of the data being updated (default: any)
 * @returns {Object} Optimistic update state and execute function
 * @property {Function} execute - Execute optimistic update with rollback
 * @property {boolean} isOptimistic - Whether an optimistic update is in progress
 * @example
 * ```tsx
 * const { execute, isOptimistic } = useOptimisticUpdate();
 * 
 * await execute(
 *   () => setItems(prev => [...prev, newItem]), // Optimistic update
 *   () => api.createItem(newItem),              // API call
 *   () => setItems(prev => prev.slice(0, -1)),  // Rollback
 *   {
 *     successMessage: 'Item created',
 *     onSuccess: (item) => console.log(item),
 *   }
 * );
 * ```
 */
export function useOptimisticUpdate<T = unknown>() {
  const [isOptimistic, setIsOptimistic] = useState(false);

  const execute = useCallback(
    /**
     * Execute optimistic update with automatic rollback on error
     * 
     * @template R - Type of the API call result
     * @param {Function} optimisticUpdate - Function to update UI optimistically
     * @param {Function} apiCall - Async function that performs the API call
     * @param {Function} rollback - Function to revert optimistic update on error
     * @param {OptimisticUpdateOptions<R>} [options] - Optional callbacks and messages
     * @returns {Promise<R | null>} Result of API call or null on error
     */
    async <R = T>(
      optimisticUpdate: () => void,
      apiCall: () => Promise<R>,
      rollback: () => void,
      options?: OptimisticUpdateOptions<R>
    ): Promise<R | null> => {
      try {
        // Apply optimistic update immediately
        setIsOptimistic(true);
        optimisticUpdate();

        // Execute API call
        const result = await apiCall();

        // Success
        setIsOptimistic(false);
        
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        
        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error: unknown) {
        // Rollback on error
        setIsOptimistic(false);
        rollback();

        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        if (options?.errorMessage) {
          toast.error(options.errorMessage);
        } else {
          toast.error(errorMessage);
        }

        if (options?.onError) {
          options.onError(error instanceof Error ? error : new Error(String(error)));
        }

        return null;
      }
    },
    []
  );

  return { execute, isOptimistic };
}

