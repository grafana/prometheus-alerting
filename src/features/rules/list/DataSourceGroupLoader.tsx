import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { Alert } from '@grafana/ui';

import { prometheusApi } from '../../../api/prometheus.endpoints';
import { DataSourceRuleGroupIdentifier, RulesSourceApplication } from '../../../types/rules';
import { hashRule } from '../../../utils/rule-id';

import { DataSourceRuleListItem } from './DataSourceRuleListItem';
import { RuleActionsButtons } from './components/RuleActionsButtons';
import { useDeleteRuleModal } from './components/DeleteRuleModal';
import { DataSourceRuleIdentifier } from '../../../utils/rule-id';

const { useGetGroupsQuery } = prometheusApi;

export interface DataSourceGroupLoaderProps {
  groupIdentifier: DataSourceRuleGroupIdentifier;
  expectedRulesCount?: number;
  application?: RulesSourceApplication;
  rulerApiEnabled?: boolean;
}

/**
 * Loads an evaluation group from Prometheus endpoint.
 * Displays a loading skeleton while the data is being fetched.
 */
export function DataSourceGroupLoader({
  groupIdentifier,
  expectedRulesCount = 3,
  application = 'prometheus',
  rulerApiEnabled = false,
}: DataSourceGroupLoaderProps) {
  const { namespace, groupName } = groupIdentifier;
  const namespaceName = namespace.name;

  const [deleteModal, showDeleteModal] = useDeleteRuleModal();

  const {
    data: promResponse,
    isLoading,
    isError,
  } = useGetGroupsQuery({
    ruleSource: { uid: groupIdentifier.rulesSource.uid },
    namespace: namespaceName,
    groupName: groupName,
  });

  const handleDuplicate = (identifier: DataSourceRuleIdentifier) => {
    // TODO: Implement duplicate functionality (navigate to rule editor with pre-filled data)
    console.log('Duplicate rule:', identifier);
  };

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
            application={application}
            rulerApiEnabled={rulerApiEnabled}
            showLocation={false}
            actions={
              <RuleActionsButtons
                rule={rule}
                groupIdentifier={groupIdentifier}
                rulerApiEnabled={rulerApiEnabled}
                onDelete={showDeleteModal}
                onDuplicate={handleDuplicate}
                compact
              />
            }
          />
        ))}
        {deleteModal}
      </>
    );
  }

  // This should never happen
  return <Alert title={`Failed to load rules from group ${groupName} in ${namespaceName}`} severity="warning" />;
}
