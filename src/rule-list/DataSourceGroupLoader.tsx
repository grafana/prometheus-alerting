import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { Alert } from '@grafana/ui';

import { prometheusApi } from '../api/prometheus.endpoints';
import { DataSourceRuleGroupIdentifier } from '../types/rules';
import { hashRule } from '../utils/rule-id';

import { DataSourceRuleListItem } from './DataSourceRuleListItem';

const { useGetGroupsQuery } = prometheusApi;

export interface DataSourceGroupLoaderProps {
  groupIdentifier: DataSourceRuleGroupIdentifier;
  expectedRulesCount?: number;
}

/**
 * Loads an evaluation group from Prometheus endpoint.
 * Displays a loading skeleton while the data is being fetched.
 */
export function DataSourceGroupLoader({ groupIdentifier, expectedRulesCount = 3 }: DataSourceGroupLoaderProps) {
  const { namespace, groupName } = groupIdentifier;
  const namespaceName = namespace.name;

  const {
    data: promResponse,
    isLoading,
    isError,
  } = useGetGroupsQuery({
    ruleSource: { uid: groupIdentifier.rulesSource.uid },
    namespace: namespaceName,
    groupName: groupName,
  });

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

  if (isError) {
    return <Alert title={`Failed to load rules from group ${groupName} in ${namespaceName}`} severity="error" />;
  }

  // There should be always only one group in the response but some Prometheus-compatible data sources
  // implement different filter parameters
  const promGroup = promResponse?.data.groups.find((g) => g.file === namespaceName && g.name === groupName);

  if (promGroup) {
    return (
      <>
        {promGroup.rules.map((rule) => (
          <DataSourceRuleListItem
            key={hashRule(rule)}
            rule={rule}
            groupIdentifier={groupIdentifier}
            application={'prometheus'}
            showLocation={false}
          />
        ))}
      </>
    );
  }

  // This should never happen
  return <Alert title={`Failed to load rules from group ${groupName} in ${namespaceName}`} severity="warning" />;
}
