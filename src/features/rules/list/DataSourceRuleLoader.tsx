import React, { memo, useMemo } from 'react';

import { skipToken } from '@reduxjs/toolkit/query';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { rulerApi } from '../../../api/rules/ruler.endpoints';
import { DataSourceRuleGroupIdentifier, Rule } from '../../../types/rules';

const { useGetRuleGroupQuery } = rulerApi;
import { getMatchingRulerRule, RulePositionHash } from '@grafana/external-rules/matching';

import { RuleExporter } from '../export';
import { DataSourceRuleListItem } from './DataSourceRuleListItem';
import { RuleActionsButtons } from './components/RuleActionsButtons';
import { SkeletonListItem } from './components/ListItem';
import { useRuleActions } from './hooks/useRuleActions';

interface DataSourceRuleLoaderProps {
  rule: Rule;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  rulePositionHash: RulePositionHash;
}

/**
 * DataSourceRuleLoader is responsible for:
 * 1. Running feature discovery for the data source (RTK Query handles deduplication)
 * 2. Determining which actions are available based on feature support
 * 3. Rendering the rule list item with appropriate actions
 *
 * This component follows the original Grafana pattern where each rule independently
 * loads what it needs, and RTK Query automatically deduplicates requests.
 */
export const DataSourceRuleLoader = memo(function DataSourceRuleLoader({
  rule,
  groupIdentifier,
  rulePositionHash,
}: DataSourceRuleLoaderProps) {
  const { rulesSource, namespace, groupName } = groupIdentifier;

  // Feature discovery - RTK Query automatically deduplicates requests per data source
  const { data: dsFeatures, isLoading: featuresLoading } = useDiscoverFeaturesQuery({
    uid: rulesSource.uid,
  });

  const rulerApiEnabled = dsFeatures?.rulerApiEnabled || false;

  // Fetch ruler rule group if Ruler API is supported
  // Skip the query if Ruler API is not enabled
  const { data: rulerRuleGroup, isLoading: isLoadingRulerGroup } = useGetRuleGroupQuery(
    rulerApiEnabled
      ? {
          dataSourceUid: rulesSource.uid,
          namespace: namespace.name,
          groupName,
        }
      : skipToken
  );

  // Match the prometheus rule with its corresponding ruler rule
  const rulerRule = useMemo(() => {
    if (!rulerRuleGroup || !rulerApiEnabled) {
      return undefined;
    }

    return getMatchingRulerRule(rulerRuleGroup.rules, rule, rulePositionHash);
  }, [rulerRuleGroup, rule, rulerApiEnabled, rulePositionHash]);

  const { handleDuplicate, handleSilence, handleDelete, handleExport, deleteModal, exportingRule, closeExportDrawer } =
    useRuleActions();

  const actions = useMemo(() => {
    if (featuresLoading || isLoadingRulerGroup) {
      return null; // Show no actions while loading
    }

    // Only show actions if we have a ruler rule (for edit/duplicate/delete)
    // or if ruler API is not enabled (for copy link only)
    if (rulerApiEnabled && !rulerRule) {
      return null;
    }

    return (
      <RuleActionsButtons
        rule={rulerRule} // Pass the actual RulerRuleDTO
        promRule={rule} // Pass the PromRuleDTO
        groupIdentifier={groupIdentifier}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onSilence={handleSilence}
        onExport={handleExport}
        compact
      />
    );
  }, [
    featuresLoading,
    isLoadingRulerGroup,
    rulerRule,
    rule,
    groupIdentifier,
    rulerApiEnabled,
    handleDelete,
    handleDuplicate,
    handleSilence,
    handleExport,
  ]);

  if (featuresLoading || isLoadingRulerGroup) {
    return <SkeletonListItem />;
  }

  return (
    <>
      <DataSourceRuleListItem
        rule={rule}
        rulerRule={rulerRule}
        groupIdentifier={groupIdentifier}
        application={dsFeatures?.application}
        actions={actions}
        showLocation={true}
      />
      {deleteModal}
      {exportingRule && <RuleExporter rule={exportingRule} onClose={closeExportDrawer} />}
    </>
  );
});
