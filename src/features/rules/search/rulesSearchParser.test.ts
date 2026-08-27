import { describe, expect, it } from 'vitest';

import { applySearchFilterToQuery, getSearchFilterFromQuery } from './rulesSearchParser';

describe('getSearchFilterFromQuery', () => {
  it('uses free text as a rule name filter', () => {
    expect(getSearchFilterFromQuery('HighErrorRate')).toEqual({ ruleName: 'HighErrorRate' });
  });

  it('combines free text with structured filters', () => {
    expect(getSearchFilterFromQuery('HighErrorRate state:firing label:team=platform')).toEqual({
      ruleName: 'HighErrorRate',
      ruleState: 'firing',
      labels: ['team=platform'],
    });
  });
});

describe('applySearchFilterToQuery', () => {
  it('serializes new filters in canonical order', () => {
    expect(
      applySearchFilterToQuery('', {
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
      applySearchFilterToQuery('state:firing namespace:production rule:HighErrorRate', {
        namespace: 'staging',
        ruleName: 'HighLatency',
        ruleState: 'pending',
      })
    ).toBe('state:pending namespace:staging rule:HighLatency');
  });

  it('retains the positions of repeated filters', () => {
    expect(
      applySearchFilterToQuery('label:team=frontend datasource:prometheus label:severity=critical', {
        dataSourceNames: ['mimir'],
        labels: ['team=platform', 'severity=warning'],
      })
    ).toBe('label:team=platform datasource:mimir label:severity=warning');
  });

  it('retains the position of an unstructured rule name', () => {
    expect(
      applySearchFilterToQuery('HighErrorRate state:firing namespace:production', {
        namespace: 'staging',
        ruleName: 'HighErrorRate',
        ruleState: 'firing',
      })
    ).toBe('HighErrorRate state:firing namespace:staging');
  });

  it('removes cleared filters', () => {
    expect(
      applySearchFilterToQuery('state:firing namespace:production', {
        ruleState: 'normal',
      })
    ).toBe('state:normal');
  });

  it('appends new filters after existing filters', () => {
    expect(
      applySearchFilterToQuery('state:firing', {
        groupName: 'api alerts',
        ruleState: 'normal',
      })
    ).toBe('state:normal group:"api alerts"');
  });
});
