import { useEffect, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useDiscoverFeaturesQuery } from '../../../../api/rules/featureDiscovery.endpoints';
import { rulerApi, RulerRulesConfigDTO } from '../../../../api/rules/mimir.endpoints';

const { useLazyGetAllRulesQuery } = rulerApi;

/**
 * Hook to fetch namespaces and groups from a data source
 * Returns a Map of namespace -> array of group names
 */
export function useNamespacesAndGroups(dataSourceUid: string | null) {
  const [fetchRules, { data: rulerRules, isLoading }] = useLazyGetAllRulesQuery();

  const { data: features } = useDiscoverFeaturesQuery(dataSourceUid ? { uid: dataSourceUid } : skipToken);

  // Fetch rules when data source or discovered path changes
  useEffect(() => {
    if (dataSourceUid && features?.application) {
      fetchRules({ dataSourceUid, application: features.application });
    }
  }, [dataSourceUid, features?.application, fetchRules]);

  // Transform ruler rules config into namespace -> groups map
  const namespaceGroups = useMemo(() => {
    if (!rulerRules) {
      return new Map<string, string[]>();
    }

    return rulerRulesToNamespaceGroups(rulerRules);
  }, [rulerRules]);

  return {
    namespaceGroups,
    isLoading,
  };
}

// Transform RulerRulesConfigDTO to Map<namespace, groupNames[]>
function rulerRulesToNamespaceGroups(rulerConfig: RulerRulesConfigDTO): Map<string, string[]> {
  const result = new Map<string, string[]>();

  Object.entries(rulerConfig).forEach(([namespace, groups]: [string, unknown]) => {
    if (Array.isArray(groups)) {
      result.set(
        namespace,
        groups.map((group: { name: string }) => group.name)
      );
    }
  });

  return result;
}
