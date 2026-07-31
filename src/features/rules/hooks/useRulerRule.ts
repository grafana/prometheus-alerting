import { useMemo } from 'react';
import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { matchRulerRuleById } from '@grafana/external-rules/matching';

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
 * Unsupported data sources return an error from the Ruler API, which callers surface.
 *
 * @param identifier - CloudRuleIdentifier containing data source UID, namespace, group name, and rule identifiers
 * @returns Rule data, group data, metadata, and loading/error states
 */
export function useRulerRule(identifier: CloudRuleIdentifier): RulerRuleResult {
  const { uid, namespace, groupName } = identifier;

  // Fetch from Ruler API - this gives us the configuration
  const rulerQuery = useGetRuleGroupQuery({
    dataSourceUid: uid,
    namespace,
    groupName,
  });

  // Extract the specific rule from the group using matching logic
  const rulerGroup = rulerQuery.data ?? undefined;
  const rulerRule = useMemo(
    () => (rulerGroup ? matchRulerRuleById(rulerGroup, identifier) : undefined),
    [rulerGroup, identifier]
  );

  return {
    rulerRule,
    rulerGroup,
    loading: rulerQuery.isLoading,
    error: rulerQuery.error,
  };
}
