/**
 * Custom hook to sync string state with URL search parameters
 * 
 * Allows sharing filtered views via URL and provides browser back/forward support.
 * State changes update the URL, and URL changes (from browser navigation) update the state.
 * 
 * @template T - Type of the string value (must extend string)
 * @param {string} key - URL parameter key
 * @param {T} defaultValue - Default value if parameter is not in URL
 * @returns {[T, Function]} Tuple of [currentValue, setValue]
 * @example
 * ```tsx
 * const [filter, setFilter] = useUrlState('filter', 'all');
 * // URL: /items?filter=active
 * // filter = 'active'
 * setFilter('completed');
 * // URL: /items?filter=completed
 * ```
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getValue = useCallback((): T => {
    const paramValue = searchParams.get(key);
    return (paramValue as T) || defaultValue;
  }, [searchParams, key, defaultValue]);

  const [state, setState] = useState<T>(getValue);

  // Update state when URL changes (browser back/forward)
  useEffect(() => {
    setState(getValue());
  }, [getValue]);

  const setUrlState = useCallback(
    (value: T) => {
      setState(value);
      
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (value === defaultValue || !value) {
        // Remove param if it's the default value
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
      
      setSearchParams(newSearchParams, { replace: true });
    },
    [key, defaultValue, searchParams, setSearchParams]
  );

  return [state, setUrlState];
}

/**
 * Custom hook to sync number state with URL search parameters
 * 
 * Similar to useUrlState but for numeric values. Handles parsing and validation.
 * 
 * @param {string} key - URL parameter key
 * @param {number} defaultValue - Default value if parameter is not in URL or invalid
 * @returns {[number, Function]} Tuple of [currentValue, setValue]
 * @example
 * ```tsx
 * const [page, setPage] = useUrlNumberState('page', 1);
 * // URL: /items?page=3
 * // page = 3
 * setPage(5);
 * // URL: /items?page=5
 * ```
 */
export function useUrlNumberState(
  key: string,
  defaultValue: number
): [number, (value: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getValue = useCallback((): number => {
    const paramValue = searchParams.get(key);
    const parsed = paramValue ? parseInt(paramValue, 10) : defaultValue;
    return isNaN(parsed) ? defaultValue : parsed;
  }, [searchParams, key, defaultValue]);

  const [state, setState] = useState<number>(getValue);

  useEffect(() => {
    setState(getValue());
  }, [getValue]);

  const setUrlState = useCallback(
    (value: number) => {
      setState(value);
      
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (value === defaultValue) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value.toString());
      }
      
      setSearchParams(newSearchParams, { replace: true });
    },
    [key, defaultValue, searchParams, setSearchParams]
  );

  return [state, setUrlState];
}

/**
 * Custom hook to sync date state with URL search parameters
 * 
 * Stores dates as ISO strings in URL and parses them back to Date objects.
 * 
 * @param {string} key - URL parameter key
 * @param {Date} [defaultValue] - Default date if parameter is not in URL or invalid
 * @returns {[Date | undefined, Function]} Tuple of [currentValue, setValue]
 * @example
 * ```tsx
 * const [startDate, setStartDate] = useUrlDateState('startDate');
 * // URL: /reports?startDate=2024-01-01T00:00:00.000Z
 * // startDate = new Date('2024-01-01')
 * setStartDate(new Date('2024-02-01'));
 * // URL: /reports?startDate=2024-02-01T00:00:00.000Z
 * ```
 */
export function useUrlDateState(
  key: string,
  defaultValue?: Date
): [Date | undefined, (value: Date | undefined) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getValue = useCallback((): Date | undefined => {
    const paramValue = searchParams.get(key);
    if (!paramValue) return defaultValue;
    
    const date = new Date(paramValue);
    return isNaN(date.getTime()) ? defaultValue : date;
  }, [searchParams, key, defaultValue]);

  const [state, setState] = useState<Date | undefined>(getValue);

  useEffect(() => {
    setState(getValue());
  }, [getValue]);

  const setUrlState = useCallback(
    (value: Date | undefined) => {
      setState(value);
      
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (!value) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value.toISOString());
      }
      
      setSearchParams(newSearchParams, { replace: true });
    },
    [key, searchParams, setSearchParams]
  );

  return [state, setUrlState];
}

