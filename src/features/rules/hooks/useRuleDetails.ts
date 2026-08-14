import { useCallback, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { DataSourceRuleIdentifier, isCloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { PromRuleDTO, PromRuleGroupDTO, RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { rulerApi } from '../../../api/rules/ruler.endpoints';
import {
  createRulePositionHash,
  getMatchingPromRule,
  matchPromRuleById,
  matchRulerRuleById,
} from '@grafana/external-rules/matching';

const { useGetGroupsQuery } = prometheusApi;
const { useGetRuleGroupQuery } = rulerApi;

export interface RuleDetailsResult {
  promRule?: PromRuleDTO;
  promGroup?: PromRuleGroupDTO;
  rulerRule?: RulerRuleDTO;
  rulerGroup?: RulerRuleGroupDTO;

  dataSourceUid: string;
  namespace: string;
  groupName: string;
  hasRulerApi: boolean;

  loading: boolean;
  error?: unknown;

  /** Refetch data from both APIs */
  refetch: () => void;
}

export function useRuleDetails(identifier: DataSourceRuleIdentifier): RuleDetailsResult {
  const { uid, namespace, groupName, ruleName } = identifier;
  const isCloudRule = isCloudRuleIdentifier(identifier);

  const { data: features, isLoading: featuresLoading, error: featuresError } = useDiscoverFeaturesQuery({ uid });

  // For CRI, check if Ruler API is actually available
  // For PRI, we never use Ruler API
  const shouldFetchRulerData = isCloudRule && (features?.rulerApiEnabled ?? false);

  const promQuery = useGetGroupsQuery({
    ruleSource: { uid },
    namespace,
    groupName,
    ruleName,
  });

  // 3. Fetch from Ruler API (only for CRI with Ruler API enabled) - this gives us configuration
  const rulerQuery = useGetRuleGroupQuery(
    shouldFetchRulerData
      ? {
          dataSourceUid: uid,
          namespace,
          groupName,
        }
      : skipToken
  );

  // 4. Extract rules using the correct matching strategy based on what data is available
  const { promRule, promGroup, rulerRule, rulerGroup } = useMemo(() => {
    // Get Prometheus group - must match namespace and groupName from identifier
    const promGroups = promQuery.data?.data.groups ?? [];
    const promGroup = promGroups.find((g: PromRuleGroupDTO) => g.file === namespace && g.name === groupName);

    // Get Ruler group (only for CRI)
    const rulerGroup = isCloudRule ? (rulerQuery.data ?? undefined) : undefined;

    // Strategy: If Ruler API is available and we have ruler data, use it as source of truth
    if (isCloudRule) {
      const rulerRule = rulerGroup ? matchRulerRuleById(rulerGroup, identifier) : undefined;

      // Match the corresponding Prometheus rule (for runtime state like alerts). The position hash
      // disambiguates fully-identical duplicate rules within the same group -- rulerRule was
      // already resolved to a specific rule instance, so its position in rulerGroup is exact.
      const rulerRulePositionHash =
        rulerGroup && rulerRule
          ? createRulePositionHash(rulerGroup.rules.indexOf(rulerRule), rulerGroup.rules.length)
          : undefined;
      const promRule =
        rulerRule && promGroup ? getMatchingPromRule(promGroup.rules, rulerRule, rulerRulePositionHash) : undefined;

      return { promRule, promGroup, rulerRule, rulerGroup };
    }

    // For PRI (Prometheus Rule Identifier), we only use Prometheus API
    const promRule = promGroup ? matchPromRuleById(promGroup, identifier) : undefined;

    return { promRule, promGroup, rulerRule: undefined, rulerGroup: undefined };
  }, [promQuery.data, rulerQuery.data, namespace, groupName, isCloudRule, identifier]);

  // 5. Determine loading and error states
  const loading = featuresLoading || promQuery.isLoading || (shouldFetchRulerData && rulerQuery.isLoading);
  const error = featuresError || promQuery.error || rulerQuery.error;

  // Refetch function to manually trigger a refresh
  const refetch = useCallback(() => {
    promQuery.refetch();
    if (shouldFetchRulerData) {
      rulerQuery.refetch();
    }
  }, [promQuery, rulerQuery, shouldFetchRulerData]);

  return {
    promRule,
    promGroup,
    rulerRule,
    rulerGroup,
    dataSourceUid: uid,
    namespace,
    groupName,
    hasRulerApi: shouldFetchRulerData,
    loading,
    error,
    refetch,
  };
}
