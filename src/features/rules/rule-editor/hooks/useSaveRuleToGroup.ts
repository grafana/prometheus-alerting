import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import type { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';

import { rulerApi } from '../../../../api/rules/ruler.endpoints';
import { mergeRequestStates } from '../../../../utils/requestState';
import { addRuleAction, updateRuleAction } from '../ruleGroupReducer';

import { useDeleteRuleFromGroup } from './useDeleteRuleFromGroup';
import { useProduceNewRuleGroup } from './useProduceNewRuleGroup';

const { useUpsertRuleGroupMutation } = rulerApi;

/** Where a rule lives: which data source, namespace and group hold it. */
export interface RuleLocation {
  uid: string;
  namespace: string;
  groupName: string;
}

export interface SaveRuleToGroupResult {
  /** True when the rule was written to a different group than the one it came from. */
  moved: boolean;
}

/** Whether two locations point at the same group in the same namespace on the same data source. */
export function isSameRuleLocation(a: RuleLocation, b: RuleLocation): boolean {
  return a.uid === b.uid && a.namespace === b.namespace && a.groupName === b.groupName;
}

/**
 * Hook for saving a rule into a group, whether it is new, edited in place, or moving.
 *
 * The Ruler API writes a whole group at a time and has no way to move a rule between groups,
 * so a move has to be done as two writes: add the rule to its new group, then take it out of
 * the old one. There is no transaction across the two, so the order matters — see below.
 */
export function useSaveRuleToGroup() {
  const [produceNewRuleGroup, produceState] = useProduceNewRuleGroup();
  const [upsertRuleGroup, upsertState] = useUpsertRuleGroupMutation();
  const [deleteRuleFromGroup, deleteState] = useDeleteRuleFromGroup();

  // The delete only runs for a move, so it is merged in only once it has started. Otherwise its
  // untouched state would keep the combined state from ever reading as successful.
  const writeStates = deleteState.isUninitialized ? [upsertState] : [upsertState, deleteState];
  const requestState = mergeRequestStates(produceState, ...writeStates);

  const saveRuleToGroup = async (
    target: RuleLocation,
    rule: RulerRuleDTO,
    /** The rule being edited, and where it currently lives. Undefined when creating a rule. */
    existingRuleIdentifier?: CloudRuleIdentifier
  ): Promise<SaveRuleToGroupResult> => {
    const movingFrom =
      existingRuleIdentifier && !isSameRuleLocation(existingRuleIdentifier, target)
        ? existingRuleIdentifier
        : undefined;

    // A rule that stays put is updated in place. A rule that is moving has to be added instead:
    // the update looks the rule up in the group it is writing to, and the destination group has
    // never held this rule, so an update there would find nothing and fail.
    const action =
      existingRuleIdentifier && !movingFrom
        ? updateRuleAction({ identifier: existingRuleIdentifier, rule })
        : addRuleAction({ rule, groupName: target.groupName });

    const newRuleGroup = await produceNewRuleGroup(target.uid, target.namespace, target.groupName, [action]);

    await upsertRuleGroup({
      dataSourceUid: target.uid,
      namespace: target.namespace,
      payload: newRuleGroup,
    }).unwrap();

    if (!movingFrom) {
      return { moved: false };
    }

    // The new copy is written first on purpose. If this second write fails the rule exists in
    // both groups, which the user can see and clean up. Deleting first and then failing to write
    // would lose the rule altogether.
    await deleteRuleFromGroup(movingFrom);

    return { moved: true };
  };

  return [saveRuleToGroup, requestState] as const;
}
