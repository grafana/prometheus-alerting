import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { skipToken } from '@reduxjs/toolkit/query';

import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { rulerApi } from '../../../api/rules/ruler.endpoints';
import { DataSourceRuleGroupIdentifier } from '../../../types/rules';

const { useGetRuleGroupQuery } = rulerApi;
import { hashRule } from '@grafana/external-rules/hashing';
import { createRulePositionHash, getMatchingRulerRule } from '@grafana/external-rules/matching';
import type { RulesSourceApplication } from '@grafana/external-rules/ruler';
import type { PromRuleGroupDTO, PromRuleDTO } from '@grafana/external-rules/vanilla';

import { RulesErrorAlert } from '../components/RulesErrorAlert';
import { DataSourceRuleListItem } from './DataSourceRuleListItem';
import { RuleActionsButtons } from './components/RuleActionsButtons';
import { useRuleActions } from './hooks/useRuleActions';

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

  const { handleDuplicate, handleSilence, handleDelete, deleteModal } = useRuleActions();

  // Fetch Prometheus rules
  const {
    data: promResponse,
    isLoading: isPromLoading,
    isError: isPromError,
    error: promError,
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
    error: rulerError,
  } = useGetRuleGroupQuery(
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
    const error = promError ?? rulerError;

    return (
      <RulesErrorAlert
        error={error}
        title={t('rules.group-loader.error', 'Failed to load rules from group {{groupName}} in {{namespaceName}}', {
          groupName,
          namespaceName,
        })}
      />
    );
  }

  // There should be always only one group in the response but some Prometheus-compatible data sources
  // implement different filter parameters
  const promGroup = promResponse?.data.groups.find(
    (g: PromRuleGroupDTO) => g.file === namespaceName && g.name === groupName
  );

  if (promGroup) {
    return (
      <>
        {promGroup.rules.map((rule: PromRuleDTO, index: number) => {
          // Match the prometheus rule with its corresponding ruler rule if available. The position
          // hash disambiguates fully-identical duplicate rules within the same group (see
          // getMatchingRulerRule in @grafana/external-rules/matching).
          const rulePositionHash = createRulePositionHash(index, promGroup.rules.length);
          const rulerRule =
            rulerRuleGroup && shouldFetchRuler
              ? getMatchingRulerRule(rulerRuleGroup.rules, rule, rulePositionHash)
              : undefined;

          const actions = (
            <RuleActionsButtons
              rule={rulerRule}
              promRule={rule}
              groupIdentifier={groupIdentifier}
              rulerGroup={rulerRuleGroup}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onSilence={handleSilence}
              compact
            />
          );

          return (
            <DataSourceRuleListItem
              key={`${hashRule(rule)}-${index}`}
              rule={rule}
              rulerRule={rulerRule}
              groupIdentifier={groupIdentifier}
              application={application}
              showLocation={false}
              actions={actions}
            />
          );
        })}
        {deleteModal}
      </>
    );
  }

  // This should never happen
  return (
    <Alert
      title={t('rules.group-loader.not-found', 'Failed to load rules from group {{groupName}} in {{namespaceName}}', {
        groupName,
        namespaceName,
      })}
      severity="warning"
    />
  );
}
