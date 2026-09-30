import { useMemo } from 'react';

import { ComboboxOption } from '@grafana/ui';

import { getExternalRulesSources } from '../../../utils/datasource';
import { useDataSourceErrors } from '../list/hooks/useDataSourceErrors';

/**
 * Hook to get data source options for the filter
 * Uses name as value for user-friendly URLs (datasource:mimir-cloud instead of datasource:abc123)
 *
 * Data sources that reported an error or have no rules are hidden from the rule list, so filtering
 * by them would only ever yield an empty list – they are dropped from the options. Ones that are
 * already selected stay in the list, so they can still be deselected.
 *
 * @param selectedNames Names of the data sources currently selected in the filter
 */
export function useDataSourceOptions(selectedNames: string[] = []): Array<ComboboxOption<string>> {
  const dataSources = useMemo(() => getExternalRulesSources(), []);
  const { errors } = useDataSourceErrors();

  const options = useMemo(() => {
    // Both the failing and the empty data sources, the report holds both kinds
    const hiddenUids = new Set(errors.map((error) => error.uid));

    return dataSources
      .filter((ds) => !hiddenUids.has(ds.uid) || selectedNames.includes(ds.name))
      .map((ds) => ({
        label: ds.name,
        value: ds.name, // Use name for user-friendly search queries
      }));
  }, [dataSources, errors, selectedNames]);

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
