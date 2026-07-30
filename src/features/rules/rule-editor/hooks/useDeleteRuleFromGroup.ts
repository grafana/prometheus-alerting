import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';

import { rulerApi } from '../../../../api/rules/mimir.endpoints';
import { mergeRequestStates } from '../../../../utils/requestState';
import { deleteRuleAction } from '../ruleGroupReducer';

import { useProduceNewRuleGroup } from './useProduceNewRuleGroup';

const { useUpsertRuleGroupMutation, useDeleteRuleGroupMutation } = rulerApi;

export interface DeleteRuleFromGroupResult {
  /** Whether the entire group was removed because the deleted rule was the last one in it */
  groupDeleted: boolean;
}

/**
 * Hook for deleting a single rule from a rule group.
 *
 * The Ruler API has no single-rule delete, so this is a read-modify-write:
 * fetch the latest group, remove the matching rule, and write the remaining
 * rules back. When the deleted rule was the last one in the group we delete the
 * group instead – the Ruler API does not accept groups without rules.
 */
export function useDeleteRuleFromGroup() {
  const [produceNewRuleGroup, produceState] = useProduceNewRuleGroup();
  const [upsertRuleGroup, upsertState] = useUpsertRuleGroupMutation();
  const [deleteRuleGroup, deleteState] = useDeleteRuleGroupMutation();

  // Callers see a single state for the whole read-modify-write, not just the fetch.
  // Only one of the two writes ever runs, so we merge in the one that did.
  const writeState = deleteState.isUninitialized ? upsertState : deleteState;
  const requestState = mergeRequestStates(produceState, writeState);

  const deleteRuleFromGroup = async (identifier: CloudRuleIdentifier): Promise<DeleteRuleFromGroupResult> => {
    const { uid, namespace, groupName } = identifier;

    const newRuleGroup = await produceNewRuleGroup(uid, namespace, groupName, [deleteRuleAction({ identifier })]);

    if (newRuleGroup.rules.length === 0) {
      await deleteRuleGroup({ dataSourceUid: uid, namespace, groupName }).unwrap();
      return { groupDeleted: true };
    }

    await upsertRuleGroup({ dataSourceUid: uid, namespace, payload: newRuleGroup }).unwrap();
    return { groupDeleted: false };
  };

  return [deleteRuleFromGroup, requestState] as const;
}
