import { normalizeInhibitRuleMatchers, type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';

import {
  formDataToInhibitRule,
  containsTextAreaUnsupportedCarriageReturn,
  normalizedInhibitRuleToFormData,
} from './InhibitRuleFormModel';

describe('normalizedInhibitRuleToFormData', () => {
  it('hydrates semantic source and target matcher values', () => {
    expect(
      normalizedInhibitRuleToFormData({
        source_matchers: [
          ['severity', '=', 'critical'],
          ['team', '=~', 'platform.*'],
        ],
        target_matchers: [['severity', '!=', 'warning']],
        equal: ['alertname', 'instance'],
      })
    ).toEqual({
      sourceMatchers: [
        { name: 'severity', operator: '=', value: 'critical' },
        { name: 'team', operator: '=~', value: 'platform.*' },
      ],
      targetMatchers: [{ name: 'severity', operator: '!=', value: 'warning' }],
      equal: 'alertname, instance',
    });
  });

  it('adds one blank equality row for a normalized rule without matchers', () => {
    expect(normalizedInhibitRuleToFormData({ source_matchers: [], target_matchers: [] })).toEqual({
      sourceMatchers: [{ name: '', operator: '=', value: '' }],
      targetMatchers: [{ name: '', operator: '=', value: '' }],
      equal: '',
    });
  });
});

describe('containsTextAreaUnsupportedCarriageReturn', () => {
  const rulesWithCarriageReturns: NormalizedInhibitRule[] = [
    { source_matchers: [['message', '=', 'a\rb']], target_matchers: [] },
    { source_matchers: [], target_matchers: [['target', '=', 'a\r\nb']] },
    { source_matchers: [['source\rname', '=', 'value']], target_matchers: [] },
  ];

  it.each(rulesWithCarriageReturns)(
    'blocks a normalized matcher with physical CR before a TextArea can normalize it',
    (rule) => {
      expect(containsTextAreaUnsupportedCarriageReturn(rule)).toBe(true);
    }
  );

  it('allows tabs, physical LF, and literal backslash-r', () => {
    expect(
      containsTextAreaUnsupportedCarriageReturn({
        source_matchers: [['message', '=', 'a\nb\tc\\r']],
        target_matchers: [],
      })
    ).toBe(false);
  });
});

describe('formDataToInhibitRule', () => {
  it('canonically quotes values and retains all matcher operators', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: [
          { name: 'a', operator: '=', value: 'b' },
          { name: 'c', operator: '!=', value: 'd' },
          { name: 'e', operator: '=~', value: 'f.*' },
          { name: 'g', operator: '!~', value: '' },
        ],
        targetMatchers: [{ name: 'severity', operator: '=', value: 'warning' }],
        equal: ' alertname , instance ',
      })
    ).toEqual({
      source_matchers: ['a="b"', 'c!="d"', 'e=~"f.*"', 'g!~""'],
      target_matchers: ['severity="warning"'],
      equal: ['alertname', 'instance'],
    });
  });

  it('quotes UTF-8 and special matcher names and escapes semantic values', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: [
          { name: 'team name', operator: '=', value: '日本語 "primary"' },
          { name: '🚨', operator: '!=', value: 'a,b{c}=~d' },
          { name: 'path', operator: '=~', value: 'C:\\temp\\.*' },
        ],
        targetMatchers: [{ name: 'message', operator: '=', value: 'first\nsecond' }],
      })
    ).toEqual({
      source_matchers: ['"team name"="日本語 \\"primary\\""', '"🚨"!="a,b{c}=~d"', 'path=~"C:\\\\temp\\\\.*"'],
      target_matchers: ['message="first\\nsecond"'],
      equal: undefined,
    });
  });

  it('keeps carriage returns and tabs as semantic control characters', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: [{ name: 'message', operator: '=', value: 'a\rb\tc' }],
        targetMatchers: [{ name: 'target', operator: '=', value: 'value' }],
      })
    ).toEqual({
      source_matchers: ['message="a\rb\tc"'],
      target_matchers: ['target="value"'],
      equal: undefined,
    });
  });

  it('canonicalizes decoded current and deprecated matcher values', () => {
    const normalized = normalizeInhibitRuleMatchers({
      source_matchers: ['team = "ops"', '{message="a\\nb",path=~"C:\\\\temp\\\\.*"}', 'unquoted=   '],
      source_match: { literal: '"ops"' },
      source_match_re: { path: 'C:\\temp\\.*' },
      target_matchers: ['severity!~"warning|info"'],
      target_match: { environment: 'production' },
      equal: ['alertname'],
    });

    expect(formDataToInhibitRule(normalizedInhibitRuleToFormData(normalized))).toEqual({
      source_matchers: [
        'team="ops"',
        'message="a\\nb"',
        'path=~"C:\\\\temp\\\\.*"',
        'unquoted=""',
        'path=~"C:\\\\temp\\\\.*"',
        'literal="\\"ops\\""',
      ],
      target_matchers: ['severity!~"warning|info"', 'environment="production"'],
      equal: ['alertname'],
    });
  });
});
