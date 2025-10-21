import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { skipToken } from '@reduxjs/toolkit/query';

import { Alert } from '@grafana/ui';

import { useDiscoverFeaturesQuery } from '../../../api/featureDiscovery.endpoints';
import { prometheusApi } from '../../../api/prometheus.endpoints';
import { useGetRulerRuleGroupQuery } from '../../../api/ruler.endpoints';
import { DataSourceRuleGroupIdentifier, RulesSourceApplication } from '../../../types/rules';
import { hashRule } from '@grafana/external-rules/hashing';
import { getMatchingRulerRule } from '../../../utils/ruleMatching';

import { DataSourceRuleListItem } from './DataSourceRuleListItem';

const { useGetGroupsQuery } = prometheusApi;

export interface DataSourceGroupLoaderProps {
  groupIdentifier: DataSourceRuleGroupIdentifier;
  expectedRulesCount?: number;
  application?: RulesSourceApplication;
  rulerApiEnabled?: boolean;
}

/**
 * Loads an evaluation group from Prometheus endpoint and optionally from Ruler endpoint.
 * Displays a loading skeleton while the data is being fetched.
 * When ruler API is enabled, fetches both Prometheus and Ruler data at the group level
 * and matches them together for efficiency.
 */
export function DataSourceGroupLoader({
  groupIdentifier,
  expectedRulesCount = 3,
  application = 'prometheus',
  rulerApiEnabled = false,
}: DataSourceGroupLoaderProps) {
  const { namespace, groupName } = groupIdentifier;
  const namespaceName = namespace.name;

  // Fetch Prometheus rules
  const {
    data: promResponse,
    isLoading: isPromLoading,
    isError: isPromError,
  } = useGetGroupsQuery({
    ruleSource: { uid: groupIdentifier.rulesSource.uid },
    namespace: namespaceName,
    groupName: groupName,
  });

  // Fetch feature discovery to determine if ruler API is available
  const { data: dsFeatures, isLoading: isFeaturesLoading } = useDiscoverFeaturesQuery({
    uid: groupIdentifier.rulesSource.uid,
  });

  const shouldFetchRuler = rulerApiEnabled && (dsFeatures?.rulerApiEnabled ?? false);

  // Fetch ruler rules if ruler API is enabled
  const {
    data: rulerRuleGroup,
    isLoading: isRulerLoading,
    isError: isRulerError,
  } = useGetRulerRuleGroupQuery(
    shouldFetchRuler
      ? {
          dataSourceUid: groupIdentifier.rulesSource.uid,
          namespace: namespaceName,
          groupName,
        }
      : skipToken
  );

  const isLoading = isPromLoading || isFeaturesLoading || (shouldFetchRuler && isRulerLoading);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: expectedRulesCount }).map((_, index) => (
          <div key={index} style={{ padding: '12px' }}>
            <Skeleton height={60} />
          </div>
        ))}
      </>
    );
  }

  if (isPromError || (shouldFetchRuler && isRulerError)) {
    return <Alert title={`Failed to load rules from group ${groupName} in ${namespaceName}`} severity="error" />;
  }

  // There should be always only one group in the response but some Prometheus-compatible data sources
  // implement different filter parameters
  const promGroup = promResponse?.data.groups.find((g) => g.file === namespaceName && g.name === groupName);

  if (promGroup) {
    return (
      <>
        {promGroup.rules.map((rule) => {
          // Match the prometheus rule with its corresponding ruler rule if available
          const rulerRule =
            rulerRuleGroup && shouldFetchRuler ? getMatchingRulerRule(rulerRuleGroup.rules, rule) : undefined;

          return (
            <DataSourceRuleListItem
              key={hashRule(rule)}
              rule={rule}
              rulerRule={rulerRule}
              groupIdentifier={groupIdentifier}
              application={application}
              showLocation={false}
            />
          );
        })}
      </>
    );
  }

  // This should never happen
  return <Alert title={`Failed to load rules from group ${groupName} in ${namespaceName}`} severity="warning" />;
}
