import { createAction, createReducer, isAnyOf } from '@reduxjs/toolkit';
import { inRange } from 'lodash';

import { RulerRuleGroupDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { CloudRuleIdentifier } from '@grafana/external-rules';
import { matchRulerRuleById } from '@grafana/external-rules/matching';

/**
 * Rule group reducer and actions for data source managed rules only.
 * Simplified version without Grafana-managed alerting support.
 */

// Rule-scoped actions
export const addRuleAction = createAction<{ rule: RulerRuleDTO; groupName?: string; interval?: string }>(
  'ruleGroup/rules/add'
);

export const updateRuleAction = createAction<{ identifier: CloudRuleIdentifier; rule: RulerRuleDTO }>(
  'ruleGroup/rules/update'
);

export const deleteRuleAction = createAction<{ identifier: CloudRuleIdentifier }>('ruleGroup/rules/delete');

// Group-scoped actions
export const updateRuleGroupAction = createAction<{ interval?: string }>('ruleGroup/update');

export const renameRuleGroupAction = createAction<{ groupName: string; interval?: string }>('ruleGroup/rename');

export const reorderRulesInRuleGroupAction = createAction<{ swaps: SwapOperation[] }>('ruleGroup/rules/reorder');

const initialState: RulerRuleGroupDTO = {
  name: 'initial',
  interval: '1m',
  rules: [],
};

/**
 * Reducer for rule group operations.
 * Handles adding, updating, deleting, and reordering rules within a group.
 */
export const ruleGroupReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(addRuleAction, (draft, { payload }) => {
      const { rule } = payload;
      draft.rules.push(rule);
    })
    .addCase(updateRuleAction, (draft, { payload }) => {
      const { identifier, rule } = payload;

      const index = findRuleIndex(draft, identifier);
      if (index !== -1) {
        draft.rules[index] = rule;
      } else {
        throw new Error('No rule matching identifier found for update');
      }
    })
    .addCase(deleteRuleAction, (draft, { payload }) => {
      const { identifier } = payload;

      const index = findRuleIndex(draft, identifier);
      if (index !== -1) {
        draft.rules.splice(index, 1);
      } else {
        throw new Error('No rule matching identifier found for delete');
      }
    })
    .addCase(reorderRulesInRuleGroupAction, (draft, { payload }) => {
      const { swaps } = payload;
      reorder(draft.rules, swaps);
    })
    // Rename should allow updating the group's name
    .addMatcher(isAnyOf(renameRuleGroupAction, addRuleAction), (draft, { payload }) => {
      const { groupName } = payload;
      draft.name = groupName ?? draft.name;
    })
    // Update, rename, and add should all allow updating the interval of the group
    .addMatcher(isAnyOf(updateRuleGroupAction, renameRuleGroupAction, addRuleAction), (draft, { payload }) => {
      const { interval } = payload;
      draft.interval = interval ?? draft.interval;
    })
    .addDefaultCase((_draft, action) => {
      throw new Error(`Unknown action for rule group reducer: ${action.type}`);
    });
});

/**
 * Find the index of a rule in the rule group by its identifier.
 * Uses the matchRulerRuleById utility from @grafana/external-rules.
 * Returns -1 if the rule is not found.
 */
function findRuleIndex(group: RulerRuleGroupDTO, identifier: CloudRuleIdentifier): number {
  const matchingRule = matchRulerRuleById(group, identifier);
  if (!matchingRule) {
    return -1;
  }
  return group.rules.indexOf(matchingRule);
}

// [oldIndex, newIndex]
export type SwapOperation = [number, number];

/**
 * ⚠️ This function mutates the input array
 * Reorder several items in a list, given a set of swaps
 */
export function reorder<T>(items: T[], swaps: Array<[number, number]>) {
  for (const swap of swaps) {
    swapItems(items, swap);
  }
  return items;
}

/**
 * ⚠️ This function mutates the input array
 * Swaps two items in an array of items
 */
export function swapItems<T>(items: T[], [oldIndex, newIndex]: SwapOperation): void {
  const inBounds = inRange(oldIndex, items.length) && inRange(newIndex, items.length);
  if (!inBounds) {
    throw new Error('Invalid operation: index out of bounds');
  }

  const [movedItem] = items.splice(oldIndex, 1);
  items.splice(newIndex, 0, movedItem);
}
