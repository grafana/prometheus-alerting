import { createAction, createReducer } from '@reduxjs/toolkit';
import { remove } from 'lodash';

import type { InhibitRule } from '@grafana/external-alertmanager/vanilla';
import {
  initialAlertmanagerConfiguration,
  type PostableParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';

export const addInhibitRuleAction = createAction<{ rule: InhibitRule }>('inhibitRule/add');
export const updateInhibitRuleAction = createAction<{ rule: InhibitRule; index: number }>('inhibitRule/update');
export const deleteInhibitRuleAction = createAction<number>('inhibitRule/delete');

/**
 * This reducer will manage actions related to inhibit rules and make sure all operations on the alertmanager
 * configuration happen immutably and only mutate what they need.
 */
export const inhibitRulesReducer = createReducer<PostableParsedUserConfiguration>(
  initialAlertmanagerConfiguration,
  (builder) => {
    builder
      // add a new inhibit rule to the alertmanager configuration
      .addCase(addInhibitRuleAction, (draft, { payload: { rule } }) => {
        draft.alertmanager_config.inhibit_rules = (draft.alertmanager_config.inhibit_rules ?? []).concat(rule);
      })
      // update an existing inhibit rule in the alertmanager configuration by index
      .addCase(updateInhibitRuleAction, (draft, { payload: { rule, index } }) => {
        const inhibitRules = draft.alertmanager_config.inhibit_rules ?? [];

        if (index < 0 || index >= inhibitRules.length) {
          throw new Error(`Invalid inhibit rule index ${index}`);
        }

        inhibitRules[index] = rule;
      })
      // delete an inhibit rule from the alertmanager configuration by index
      .addCase(deleteInhibitRuleAction, (draft, { payload: index }) => {
        const inhibitRules = draft.alertmanager_config.inhibit_rules ?? [];

        if (index < 0 || index >= inhibitRules.length) {
          throw new Error(`Invalid inhibit rule index ${index}`);
        }

        remove(inhibitRules, (_, idx) => idx === index);
      });
  }
);
