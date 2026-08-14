import { Action } from '@reduxjs/toolkit';
import { rulerApi } from '../../../../api/rules/ruler.endpoints';
import { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { ruleGroupReducer, addRuleAction } from '../ruleGroupReducer';
import { isNotFoundError } from '../../../../utils/errors';

const { useLazyGetRuleGroupQuery } = rulerApi;

const DEFAULT_GROUP_EVALUATION_INTERVAL = '1m';

export const RulerNotSupportedError = (name: string) =>
  new Error(`DataSource ${name} does not support ruler API or does not have the ruler API enabled.`);

/**
 * Hook for safely fetching a rule group's definition, applying changes to it,
 * and preparing it for persistence.
 *
 * This ensures we always fetch the latest rule group before making changes,
 * protecting against accidentally overwriting other rules in the group.
 *
 * Simplified version for data source managed rules only (no Grafana-managed alerting).
 */
export function useProduceNewRuleGroup() {
  const [fetchRuleGroup, requestState] = useLazyGetRuleGroupQuery();

  /**
   * Fetch the latest rule group configuration and apply actions to it via the reducer.
   *
   * The Ruler API does not allow operations on a single rule and will always
   * overwrite the existing rule group with the payload.
   *
   * Flow:
   * ┌─────────────────────────┐  ┌───────────────┐  ┌──────────────────┐
   * │ fetch latest rule group │─▶│ apply actions │─▶│  new rule group  │
   * └─────────────────────────┘  └───────────────┘  └──────────────────┘
   *
   * @param dataSourceUid - UID of the data source
   * @param namespace - Namespace/folder name
   * @param groupName - Rule group name
   * @param actions - Array of Redux actions to apply to the rule group
   * @returns The new rule group definition
   */
  const produceNewRuleGroup = async (
    dataSourceUid: string,
    namespace: string,
    groupName: string,
    actions: Action[]
  ): Promise<RulerRuleGroupDTO> => {
    // Fetch the latest rule group definition
    const latestRuleGroupDefinition = await fetchRuleGroup({
      dataSourceUid,
      namespace,
      groupName,
    })
      .unwrap()
      .catch((error: unknown) => {
        // If group doesn't exist (404), return null to create a new one
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      });

    // If group doesn't exist, create a blank one
    const initialRuleGroupDefinition =
      latestRuleGroupDefinition ?? createBlankRuleGroup(groupName, DEFAULT_GROUP_EVALUATION_INTERVAL);

    // Apply all actions through the reducer to produce the new rule group
    const newRuleGroupDefinition = actions.reduce((ruleGroup, action) => {
      // Preserve the interval from existing groups when adding rules
      // This matches Grafana's behavior: we don't allow changing interval for existing groups
      if (latestRuleGroupDefinition && addRuleAction.match(action)) {
        action.payload.interval = latestRuleGroupDefinition.interval;
      }
      return ruleGroupReducer(ruleGroup, action);
    }, initialRuleGroupDefinition);

    return newRuleGroupDefinition;
  };

  return [produceNewRuleGroup, requestState] as const;
}

/**
 * Create a blank rule group with default values
 */
const createBlankRuleGroup = (name: string, interval: string): RulerRuleGroupDTO => ({
  name,
  interval,
  rules: [],
});
