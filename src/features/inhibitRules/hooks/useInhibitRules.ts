import { normalizeInhibitRuleMatchers, type InhibitRule } from '@grafana/external-alertmanager/vanilla';
import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import {
  addInhibitRuleAction,
  updateInhibitRuleAction,
  deleteInhibitRuleAction,
} from '../../../reducers/alertmanager/inhibitRules';

/**
 * Hook to fetch and manage inhibit rules from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * Textual matcher syntax is decoded into ObjectMatcher arrays; deprecated matcher maps already contain semantic values.
 */
export function useInhibitRules() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  // Select the appropriate API endpoint based on implementation
  // Mimir uses getUserConfiguration, vanilla Alertmanager uses getConfiguration
  const mimirQueryResult = mimirAlertmanagerApi.endpoints.getUserConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation !== 'mimir',
    }
  );

  const vanillaQueryResult = alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation === 'mimir',
    }
  );

  const queryResult = implementation === 'mimir' ? mimirQueryResult : vanillaQueryResult;

  const rawInhibitRules = queryResult.data?.alertmanager_config?.inhibit_rules ?? [];
  const inhibitRules = rawInhibitRules.map(normalizeInhibitRuleMatchers);

  return {
    ...queryResult,
    inhibitRules,
  };
}

/**
 * Hook to add a new inhibit rule to the Alertmanager configuration.
 * Only works with Mimir-backed Alertmanager (requires configuration API).
 *
 * @example
 * const [addInhibitRule, { isLoading, error, isSuccess }] = useAddInhibitRule();
 * await addInhibitRule(newRule);
 */
export function useAddInhibitRule() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const addInhibitRuleFn = async (rule: InhibitRule) => {
    return produceNewConfig(addInhibitRuleAction({ rule }));
  };

  return [addInhibitRuleFn, state] as const;
}

/**
 * Hook to update an existing inhibit rule in the Alertmanager configuration.
 * Only works with Mimir-backed Alertmanager (requires configuration API).
 *
 * @example
 * const [updateInhibitRule, { isLoading, error, isSuccess }] = useUpdateInhibitRule();
 * await updateInhibitRule(updatedRule, ruleIndex);
 */
export function useUpdateInhibitRule() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const updateInhibitRuleFn = async (rule: InhibitRule, index: number) => {
    return produceNewConfig(updateInhibitRuleAction({ rule, index }));
  };

  return [updateInhibitRuleFn, state] as const;
}

/**
 * Hook to delete an inhibit rule from the Alertmanager configuration.
 * Only works with Mimir-backed Alertmanager (requires configuration API).
 *
 * @example
 * const [deleteInhibitRule, { isLoading, error, isSuccess }] = useDeleteInhibitRule();
 * await deleteInhibitRule(ruleIndex);
 */
export function useDeleteInhibitRule() {
  const [produceNewConfig, state] = useProduceNewAlertmanagerConfiguration();

  const deleteInhibitRuleFn = async (index: number) => {
    return produceNewConfig(deleteInhibitRuleAction(index));
  };

  return [deleteInhibitRuleFn, state] as const;
}
