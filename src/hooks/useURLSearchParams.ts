import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook to manage URL search parameters with a simplified API
 * Returns current search params and an update function
 */
export function useURLSearchParams(): [URLSearchParams, (values: Record<string, string | undefined>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const update = useCallback(
    (values: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams);

      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      // Use replace: true to avoid cluttering browser history
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return [searchParams, update];
}
