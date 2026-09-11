import { describe, expect, it } from 'vitest';

import { getSearchFilterFromQuery } from './rulesSearchParser';

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

  it('ignores filter keys that carry no value', () => {
    expect(getSearchFilterFromQuery('rule: state:')).toEqual({});
    expect(getSearchFilterFromQuery('namespace:"" HighErrorRate')).toEqual({ ruleName: 'HighErrorRate' });
  });

  it('drops surrounding quotes from free text and unterminated filter values', () => {
    expect(getSearchFilterFromQuery('"High Error Rate"')).toEqual({ ruleName: 'High Error Rate' });
    expect(getSearchFilterFromQuery('rule:"HighErrorRate')).toEqual({ ruleName: 'HighErrorRate' });
  });

  it('keeps the first value of a repeated single-value filter out of the free text', () => {
    expect(getSearchFilterFromQuery('state:firing state:pending')).toEqual({ ruleState: 'firing' });
  });

  it('treats a recording rule name that looks like a state or type filter as free text', () => {
    expect(getSearchFilterFromQuery('type:request_rate:sum')).toEqual({ ruleName: 'type:request_rate:sum' });
    expect(getSearchFilterFromQuery('state:request_errors:rate5m')).toEqual({
      ruleName: 'state:request_errors:rate5m',
    });
  });

  it('keeps a valid state or type filter alongside free text', () => {
    expect(getSearchFilterFromQuery('type:recording namespace:container_cpu:sum')).toEqual({
      ruleType: 'recording',
      namespace: 'container_cpu:sum',
    });
  });

  it('lowercases state and type values so they match the rule data', () => {
    expect(getSearchFilterFromQuery('State:FIRING Type:Alerting')).toEqual({
      ruleState: 'firing',
      ruleType: 'alerting',
    });
  });

  it('keeps a rule name that contains colons', () => {
    expect(getSearchFilterFromQuery('test:request_rate:sum')).toEqual({ ruleName: 'test:request_rate:sum' });
  });
});
