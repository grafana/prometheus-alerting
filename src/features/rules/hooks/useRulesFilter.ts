import { useCallback, useMemo } from 'react';

import { useURLSearchParams } from '../../../hooks/useURLSearchParams';
import { RulesFilter, applySearchFilterToQuery, getSearchFilterFromQuery } from '../search/rulesSearchParser';

/**
 * Hook to manage rules filter state from URL query parameters
 * Returns the current filter state and functions to update it
 */
export function useRulesFilter() {
  const [queryParams, updateQueryParams] = useURLSearchParams();
  const searchQuery = queryParams.get('search') ?? '';

  // Parse the search query into a filter object
  const filterState = useMemo<RulesFilter>(() => {
    return getSearchFilterFromQuery(searchQuery);
  }, [searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filterState.dataSourceNames && filterState.dataSourceNames.length > 0) ||
      !!filterState.namespace ||
      !!filterState.groupName ||
      !!filterState.ruleName ||
      !!filterState.ruleState ||
      !!filterState.ruleType ||
      (filterState.labels && filterState.labels.length > 0)
    );
  }, [filterState]);

  // Update filters (converts filter object to search query and updates URL)
  const updateFilters = useCallback(
    (newFilter: RulesFilter) => {
      const newSearchQuery = applySearchFilterToQuery(newFilter);
      updateQueryParams({ search: newSearchQuery });
    },
    [updateQueryParams]
  );

  // Directly set the search query string
  const setSearchQuery = useCallback(
    (newSearchQuery: string | undefined) => {
      updateQueryParams({ search: newSearchQuery });
    },
    [updateQueryParams]
  );

  // Clear all filters
  const clearAll = useCallback(() => {
    updateQueryParams({ search: undefined });
  }, [updateQueryParams]);

  return {
    filterState,
    hasActiveFilters,
    searchQuery,
    setSearchQuery,
    updateFilters,
    clearAll,
  };
}
