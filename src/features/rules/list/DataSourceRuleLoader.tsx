import React, { memo, useMemo } from 'react';

import { skipToken } from '@reduxjs/toolkit/query';

import { getMatchingRulerRule, RulePositionHash } from '@grafana/external-rules/matching';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { rulerApi } from '../../../api/rules/ruler.endpoints';
import { DataSourceRuleGroupIdentifier, Rule } from '../../../types/rules';

import { RuleExporter } from '../export';
import { DataSourceRuleListItem } from './DataSourceRuleListItem';
import { RuleActionsButtons } from './components/RuleActionsButtons';
import { SkeletonListItem } from './components/ListItem';
import { useRuleActions } from './hooks/useRuleActions';

const { useGetAllRulesQuery } = rulerApi;

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
 * All instances for a data source share one RTK Query cache entry for its Ruler configuration.
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

  const { data: rulerRules, isLoading: isLoadingRulerRules } = useGetAllRulesQuery(
    rulerApiEnabled ? { dataSourceUid: rulesSource.uid } : skipToken
  );

  const rulerRule = useMemo(() => {
    if (!rulerRules || !rulerApiEnabled) {
      return undefined;
    }

    const rulerRuleGroup = rulerRules[namespace.name]?.find((group) => group.name === groupName);
    return rulerRuleGroup ? getMatchingRulerRule(rulerRuleGroup.rules, rule, rulePositionHash) : undefined;
  }, [groupName, namespace.name, rulerApiEnabled, rulerRules, rule, rulePositionHash]);

  const { handleDuplicate, handleSilence, handleDelete, handleExport, deleteModal, exportingRule, closeExportDrawer } =
    useRuleActions();

  const actions = useMemo(() => {
    if (featuresLoading || isLoadingRulerRules) {
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
    isLoadingRulerRules,
    rulerRule,
    rule,
    groupIdentifier,
    rulerApiEnabled,
    handleDelete,
    handleDuplicate,
    handleSilence,
    handleExport,
  ]);

  if (featuresLoading || isLoadingRulerRules) {
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
