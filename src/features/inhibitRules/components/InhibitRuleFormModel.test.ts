import { normalizeInhibitRuleMatchers } from '@grafana/external-alertmanager/vanilla';

import {
  formDataToInhibitRule,
  hasUnsupportedCarriageReturn,
  normalizedInhibitRuleToFormData,
  isEditableMatcherValueToken,
} from './InhibitRuleFormModel';

describe('normalizedInhibitRuleToFormData', () => {
  it('maps normalized source and target lexical matcher tokens directly to rows', () => {
    expect(
      normalizedInhibitRuleToFormData({
        source_matchers: [
          ['severity', '=', 'critical'],
          ['team', '=~', '"platform.*"'],
        ],
        target_matchers: [['severity', '!=', '"warning"']],
        equal: ['alertname', 'instance'],
      })
    ).toEqual({
      sourceMatchers: [
        { name: 'severity', operator: '=', value: 'critical' },
        { name: 'team', operator: '=~', value: '"platform.*"' },
      ],
      targetMatchers: [{ name: 'severity', operator: '!=', value: '"warning"' }],
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

describe('isEditableMatcherValueToken', () => {
  it.each([
    ['', true, 'allows blank values'],
    ['bare-token', true, 'allows bare values'],
    ['"quoted value"', true, 'allows quoted values'],
    ['"escaped \\"quote\\" and \\\\backslash"', true, 'allows escaped quotes and backslashes'],
    [' bare-token', false, 'rejects surrounding whitespace on bare values'],
    ['bare"quote', false, 'rejects quotes in bare values'],
    ['"unterminated', false, 'rejects unterminated quoted values'],
    ['"unescaped " quote"', false, 'rejects unescaped quotes in quoted values'],
    [['"', 'trailing', '\\'].join(''), false, 'rejects trailing quote escapes'],
    ['"line\nbreak"', false, 'rejects physical line feeds'],
    ['"carriage\rreturn"', false, 'rejects physical carriage returns'],
  ])('%s: %s (%s)', (value, expected) => {
    expect(isEditableMatcherValueToken(value)).toBe(expected);
  });
});

describe('hasUnsupportedCarriageReturn', () => {
  it('finds carriage returns in either matcher array', () => {
    expect(
      hasUnsupportedCarriageReturn({
        source_matchers: [['source', '=', '"a\rb"']],
        target_matchers: [['target', '=', 'value']],
      })
    ).toBe(true);
    expect(
      hasUnsupportedCarriageReturn({
        source_matchers: [['source', '=', 'value']],
        target_matchers: [['target', '=', 'value']],
      })
    ).toBe(false);
  });
});

describe('formDataToInhibitRule', () => {
  it('preserves lexical values and encodes a blank new value as empty quoted syntax', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: [
          { name: 'a', operator: '=', value: 'b' },
          { name: 'c', operator: '!=', value: '"d"' },
          { name: 'e', operator: '=~', value: '"f.*"' },
          { name: 'g', operator: '!~', value: '' },
        ],
        targetMatchers: [{ name: 'severity', operator: '=', value: 'warning' }],
        equal: ' alertname , instance ',
      })
    ).toEqual({
      source_matchers: ['a=b', 'c!="d"', 'e=~"f.*"', 'g!~""'],
      target_matchers: ['severity=warning'],
      equal: ['alertname', 'instance'],
    });
  });

  it('does not reinterpret backslash escape sequences', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: [{ name: 'message', operator: '=', value: '"a\\nb"' }],
        targetMatchers: [
          { name: 'tab', operator: '=', value: '"a\\tb"' },
          { name: 'carriage', operator: '=', value: '"a\\rb"' },
          { name: 'hex', operator: '=', value: '"\\x41"' },
          { name: 'unicode', operator: '=', value: '"\\u0041"' },
        ],
      })
    ).toEqual({
      source_matchers: ['message="a\\nb"'],
      target_matchers: ['tab="a\\tb"', 'carriage="a\\rb"', 'hex="\\x41"', 'unicode="\\u0041"'],
      equal: undefined,
    });
  });

  it('writes line feeds with the correct classic escape parity', () => {
    const lineFeed = '\n';
    const normalized = normalizeInhibitRuleMatchers({
      source_matchers: [`zero="a${lineFeed}b"`, `one="a\\${lineFeed}b"`, `two="a\\\\${lineFeed}b"`],
      target_matchers: ['target="value"'],
    });

    expect(formDataToInhibitRule(normalizedInhibitRuleToFormData(normalized))).toEqual({
      source_matchers: [String.raw`zero="a\nb"`, String.raw`one="a\\\nb"`, String.raw`two="a\\\nb"`],
      target_matchers: ['target="value"'],
      equal: undefined,
    });
  });

  it('round-trips current and deprecated matcher syntax without changing escapes', () => {
    const normalized = normalizeInhibitRuleMatchers({
      source_matchers: ['team = "ops"', '{message="a\\nb",path=~"C:\\\\temp\\\\.*"}'],
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
        'path=~"C:\\\\temp\\\\.*"',
        'literal="\\"ops\\""',
      ],
      target_matchers: ['severity!~"warning|info"', 'environment="production"'],
      equal: ['alertname'],
    });
  });
});
