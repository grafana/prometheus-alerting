import { createAction, createReducer } from '@reduxjs/toolkit';
import { remove } from 'lodash';

import { type ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';

export const deleteInhibitRuleAction = createAction<number>('inhibitRule/delete');

const initialState: ParsedUserConfiguration = {
  alertmanager_config: {},
  template_files: {},
};

/**
 * This reducer will manage actions related to inhibit rules and make sure all operations on the alertmanager
 * configuration happen immutably and only mutate what they need.
 */
export const inhibitRulesReducer = createReducer(initialState, (builder) => {
  builder
    // delete an inhibit rule from the alertmanager configuration by index
    .addCase(deleteInhibitRuleAction, (draft, { payload: index }) => {
      const inhibitRules = draft.alertmanager_config.inhibit_rules ?? [];

      if (index < 0 || index >= inhibitRules.length) {
        throw new Error(`Invalid inhibit rule index ${index}`);
      }

      remove(inhibitRules, (_, idx) => idx === index);
    });
});
