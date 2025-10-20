import { useMemo } from 'react';

import { getExternalRulesSources } from '../../../utils/datasource';

/**
 * Hook to get data source options for the filter
 */
export function useDataSourceOptions() {
  const dataSources = useMemo(() => getExternalRulesSources(), []);

  const options = useMemo(() => {
    return dataSources.map((ds) => ({
      label: ds.name,
      value: ds.uid,
    }));
  }, [dataSources]);

  return options;
}

/**
 * Hook to get namespace/group options for autocomplete
 * Note: This is a simplified version that returns a function for async loading
 * In a full implementation, you would fetch actual namespaces/groups from the API
 */
export function useNamespaceAndGroupOptions() {
  // For now, return a simple async function that allows user to type any value
  // In a full implementation, you would query the API to get actual namespaces
  const namespaceOptions = useMemo(() => {
    return async (inputValue: string) => {
      // Return the typed value as an option
      if (inputValue) {
        return [{ label: inputValue, value: inputValue }];
      }
      return [];
    };
  }, []);

  const groupOptions = useMemo(() => {
    return async (inputValue: string) => {
      // Return the typed value as an option
      if (inputValue) {
        return [{ label: inputValue, value: inputValue }];
      }
      return [];
    };
  }, []);

  return {
    namespaceOptions,
    groupOptions,
  };
}

/**
 * Hook to get label options for autocomplete
 * Note: This is a simplified version that allows free-form input
 * In a full implementation, you would fetch actual labels from the API
 */
export function useLabelOptions() {
  const labelOptions = useMemo(() => {
    return async (inputValue: string) => {
      // Return the typed value as an option
      if (inputValue) {
        return [{ label: inputValue, value: inputValue }];
      }
      return [];
    };
  }, []);

  return { labelOptions };
}
