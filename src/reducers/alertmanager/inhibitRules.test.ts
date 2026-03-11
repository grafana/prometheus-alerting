import {
  initialAlertmanagerConfiguration,
  PostableParsedUserConfiguration,
  PostableParsedUserConfigurationSchema,
} from '@grafana/external-alertmanager/mimir';
import type { InhibitRule } from '@grafana/external-alertmanager/vanilla';
import {
  addInhibitRuleAction,
  deleteInhibitRuleAction,
  inhibitRulesReducer,
  updateInhibitRuleAction,
} from './inhibitRules';

function mockInhibitRule(overrides: Partial<InhibitRule> = {}): InhibitRule {
  return {
    source_matchers: ['severity = critical'],
    target_matchers: ['severity = warning'],
    equal: ['alertname', 'instance'],
    ...overrides,
  };
}

describe('inhibitRulesReducer', () => {
  const initialConfig: PostableParsedUserConfiguration = {
    alertmanager_config: {
      ...initialAlertmanagerConfiguration.alertmanager_config,
      inhibit_rules: [
        mockInhibitRule({ source_matchers: ['severity = critical'], target_matchers: ['severity = warning'] }),
        mockInhibitRule({
          source_matchers: ['team = ops'],
          target_matchers: ['team = ops', 'severity = info'],
          equal: ['namespace'],
        }),
      ],
    },
    template_files: {},
  };

  describe('add', () => {
    it('should add a new inhibit rule to the end of the list', () => {
      const newRule = mockInhibitRule({
        source_matchers: ['alertname = ClusterDown'],
        target_matchers: ['team = platform'],
        equal: ['cluster'],
      });
      const action = addInhibitRuleAction({ rule: newRule });

      const result = inhibitRulesReducer(initialConfig, action);

      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result.alertmanager_config.inhibit_rules).toHaveLength(3);
      expect(result.alertmanager_config.inhibit_rules?.[2]).toEqual(newRule);
    });

    it('should initialize inhibit_rules if the array was undefined', () => {
      const configWithoutRules: PostableParsedUserConfiguration = {
        alertmanager_config: { ...initialAlertmanagerConfiguration.alertmanager_config },
        template_files: {},
      };
      delete configWithoutRules.alertmanager_config.inhibit_rules;

      const newRule = mockInhibitRule();
      const result = inhibitRulesReducer(configWithoutRules, addInhibitRuleAction({ rule: newRule }));

      expect(result.alertmanager_config.inhibit_rules).toHaveLength(1);
      expect(result.alertmanager_config.inhibit_rules?.[0]).toEqual(newRule);
    });
  });

  describe('update', () => {
    it('should update the rule at the given index', () => {
      const updatedRule = mockInhibitRule({
        source_matchers: ['severity = critical'],
        target_matchers: ['severity = info'],
        equal: ['job'],
      });
      const action = updateInhibitRuleAction({ rule: updatedRule, index: 0 });

      const result = inhibitRulesReducer(initialConfig, action);

      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result.alertmanager_config.inhibit_rules).toHaveLength(2);
      expect(result.alertmanager_config.inhibit_rules?.[0]).toEqual(updatedRule);
      // second rule is unchanged
      expect(result.alertmanager_config.inhibit_rules?.[1]).toEqual(
        initialConfig.alertmanager_config.inhibit_rules?.[1]
      );
    });

    it('should throw when the index is out of bounds', () => {
      const action = updateInhibitRuleAction({ rule: mockInhibitRule(), index: 99 });
      expect(() => inhibitRulesReducer(initialConfig, action)).toThrow('Invalid inhibit rule index 99');
    });
  });

  describe('delete', () => {
    it('should remove the rule at the given index', () => {
      const action = deleteInhibitRuleAction(0);

      const result = inhibitRulesReducer(initialConfig, action);

      expect(PostableParsedUserConfigurationSchema.parse(result)).toEqual(result);
      expect(result.alertmanager_config.inhibit_rules).toHaveLength(1);
      expect(result.alertmanager_config.inhibit_rules?.[0]).toEqual(
        initialConfig.alertmanager_config.inhibit_rules?.[1]
      );
    });

    it('should throw when the index is out of bounds', () => {
      const action = deleteInhibitRuleAction(99);
      expect(() => inhibitRulesReducer(initialConfig, action)).toThrow('Invalid inhibit rule index 99');
    });
  });
});
