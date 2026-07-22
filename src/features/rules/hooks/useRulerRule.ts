import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { matchRulerRuleById } from '@grafana/external-rules/matching';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { rulerApi } from '../../../api/rules/mimir.endpoints';

const { useGetRuleGroupQuery } = rulerApi;

export interface RulerRuleResult {
  rulerRule?: RulerRuleDTO;
  rulerGroup?: RulerRuleGroupDTO;
  loading: boolean;
  error?: unknown;
}

/**
 * Hook for fetching a single rule from the Ruler API config endpoint.
 * This hook is optimized for the Rule Editor which only needs configuration data
 * from the Ruler API and doesn't need runtime state from the Prometheus API.
 *
 * @param identifier - CloudRuleIdentifier containing data source UID, namespace, group name, and rule identifiers
 * @returns Rule data, group data, metadata, and loading/error states
 */
export function useRulerRule(identifier: CloudRuleIdentifier): RulerRuleResult {
  const { uid, namespace, groupName } = identifier;

  const { data: features } = useDiscoverFeaturesQuery({ uid });

  // Fetch from Ruler API - this gives us the configuration
  const rulerQuery = useGetRuleGroupQuery(
    features
      ? {
          dataSourceUid: uid,
          namespace,
          groupName,
        }
      : skipToken
  );

  // Extract the specific rule from the group using matching logic
  const { rulerRule, rulerGroup } = useMemo(() => {
    const rulerGroup = rulerQuery.data ?? undefined;
    const rulerRule = rulerGroup ? matchRulerRuleById(rulerGroup, identifier) : undefined;

    return { rulerRule, rulerGroup };
  }, [rulerQuery.data, identifier]);

  return {
    rulerRule,
    rulerGroup,
    loading: rulerQuery.isLoading,
    error: rulerQuery.error,
  };
}
