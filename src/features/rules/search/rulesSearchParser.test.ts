import { describe, expect, it } from 'vitest';

import { applySearchFilterToQuery, parseRulesSearchQuery } from './rulesSearchParser';

describe('parseRulesSearchQuery', () => {
  it('uses free text as a rule name filter', () => {
    expect(parseRulesSearchQuery('HighErrorRate')).toEqual({
      filter: { ruleName: 'HighErrorRate' },
      filterOrder: ['rule'],
    });
  });

  it('combines free text with structured filters in their original order', () => {
    expect(parseRulesSearchQuery('HighErrorRate state:firing label:team=platform')).toEqual({
      filter: {
        ruleName: 'HighErrorRate',
        ruleState: 'firing',
        labels: ['team=platform'],
      },
      filterOrder: ['rule', 'state', 'label'],
    });
  });

  it('retains repeated filters in their original order', () => {
    expect(parseRulesSearchQuery('label:team=frontend state:firing label:severity=critical')).toEqual({
      filter: {
        ruleState: 'firing',
        labels: ['team=frontend', 'severity=critical'],
      },
      filterOrder: ['label', 'state', 'label'],
    });
  });
});

describe('applySearchFilterToQuery', () => {
  it('serializes new filters in canonical order', () => {
    expect(
      applySearchFilterToQuery([], {
        dataSourceNames: ['prometheus', 'mimir'],
        namespace: 'production',
        groupName: 'api alerts',
        ruleName: 'HighErrorRate',
        ruleState: 'firing',
        ruleType: 'alerting',
        labels: ['team=platform', 'severity=critical'],
      })
    ).toBe(
      'datasource:prometheus datasource:mimir namespace:production group:"api alerts" rule:HighErrorRate state:firing type:alerting label:team=platform label:severity=critical'
    );
  });

  it('retains the original filter order when values change', () => {
    expect(
      applySearchFilterToQuery(['state', 'namespace', 'rule'], {
        namespace: 'staging',
        ruleName: 'HighLatency',
        ruleState: 'pending',
      })
    ).toBe('state:pending namespace:staging rule:HighLatency');
  });

  it('retains the positions of repeated filters', () => {
    expect(
      applySearchFilterToQuery(['label', 'datasource', 'label'], {
        dataSourceNames: ['mimir'],
        labels: ['team=platform', 'severity=warning'],
      })
    ).toBe('label:team=platform datasource:mimir label:severity=warning');
  });

  it('removes cleared filters', () => {
    expect(
      applySearchFilterToQuery(['state', 'namespace'], {
        ruleState: 'normal',
      })
    ).toBe('state:normal');
  });

  it('appends new filters after existing filters', () => {
    expect(
      applySearchFilterToQuery(['state'], {
        groupName: 'api alerts',
        ruleState: 'normal',
      })
    ).toBe('state:normal group:"api alerts"');
  });
});
