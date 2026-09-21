import { describe, expect, it } from 'vitest';

import { applySearchFilterToQuery, getSearchFilterFromQuery } from './rulesSearchParser';

describe('getSearchFilterFromQuery', () => {
  it.each([
    ['datasource and labels repeat while single filters use their first value', 'datasource:one datasource:two label:a=b label:c=d namespace:prod namespace:dev', { dataSourceNames: ['one', 'two'], labels: ['a=b', 'c=d'], namespace: 'prod' }],
    ['unknown prefixes and invalid known values are free text', 'foo_namespace:bar type:request_rate state:not-real', { ruleName: 'foo_namespace:bar type:request_rate state:not-real' }],
    ['filter syntax inside a value is literal', 'label:description=state:firing', { labels: ['description=state:firing'] }],
    ['quoted values can contain spaces and filter syntax', 'namespace:"prod rules" label:"description=state:firing"', { namespace: 'prod rules', labels: ['description=state:firing'] }],
    ['quoted rule values are literal', 'rule:"state:firing" state:pending', { ruleName: 'state:firing', ruleState: 'pending' }],
    ['a quoted state-like token is a literal name', '"state:firing"', { ruleName: 'state:firing' }],
    ['quoted suffixes stay within the same filter value', 'namespace:"a"state:firing', { namespace: 'astate:firing' }],
    ['unterminated quoted values consume the rest of the query', 'rule:"High Error state:firing', { ruleName: 'High Error state:firing' }],
    ['escaped quotes and backslashes are decoded only when escaped', 'rule:"a\\\\b\\\"c\\q"', { ruleName: 'a\\b"c\\q' }],
  ])('%s', (_description, query, expected) => {
    expect(getSearchFilterFromQuery(query)).toEqual(expected);
  });

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

  it('recognizes every supported structured field', () => {
    expect(
      getSearchFilterFromQuery(
        'datasource:main namespace:prod group:api rule:ErrorRate state:pending type:alerting label:team=platform'
      )
    ).toEqual({
      dataSourceNames: ['main'],
      namespace: 'prod',
      groupName: 'api',
      ruleName: 'ErrorRate',
      ruleState: 'pending',
      ruleType: 'alerting',
      labels: ['team=platform'],
    });
  });

  it('does not recognize inherited property names or rescan quoted token suffixes', () => {
    expect(getSearchFilterFromQuery('constructor:main namespace:"prod"state:firing')).toEqual({
      namespace: 'prodstate:firing',
      ruleName: 'constructor:main',
    });
  });

  it('normalizes free-text whitespace without treating quoted content as filters', () => {
    expect(getSearchFilterFromQuery('  foo_namespace:bar  "state:firing"  ')).toEqual({
      ruleName: 'foo_namespace:bar state:firing',
    });
  });
});

describe('applySearchFilterToQuery', () => {
  it.each([
    ['removes filters whose values were cleared', 'namespace:prod ErrorRate state:firing', { ruleName: 'ErrorRate' }, 'ErrorRate'],
    ['retains repeated filter positions', 'datasource:one ErrorRate datasource:two label:a=b label:c=d', { dataSourceNames: ['main', 'backup'], ruleName: 'Latency', labels: ['x=y', 'z=w'] }, 'datasource:main Latency datasource:backup label:x=y label:z=w'],
    ['safely writes a name that resembles a valid filter', 'ErrorRate namespace:prod', { ruleName: 'type:recording', namespace: 'dev' }, 'rule:type:recording namespace:dev'],
    ['safely writes quotes and backslashes in a name', 'ErrorRate state:firing', { ruleName: 'a"b\\c', ruleState: 'pending' }, 'rule:"a\\"b\\\\c" state:pending'],
  ])('%s', (_description, query, filter, expected) => {
    expect(applySearchFilterToQuery(query, filter)).toBe(expected);
    expect(getSearchFilterFromQuery(expected)).toEqual(filter);
  });
  it('preserves existing filter positions and free-text syntax', () => {
    const query = 'label:team=platform ErrorRate namespace:prod';
    const filter = {
      labels: ['team=alerting'],
      ruleName: 'LatencyRate',
      namespace: 'dev',
    };

    expect(applySearchFilterToQuery(query, filter)).toBe('label:team=alerting LatencyRate namespace:dev');
  });

  it('appends newly added filters after the existing query layout', () => {
    expect(applySearchFilterToQuery('ErrorRate', { ruleName: 'ErrorRate', namespace: 'prod' })).toBe(
      'ErrorRate namespace:prod'
    );
  });

  it('keeps rule names that resemble invalid state or type filters as free text', () => {
    expect(
      applySearchFilterToQuery('type:request_rate:sum', {
        ruleName: 'type:request_rate:sum',
        namespace: 'prod',
      })
    ).toBe('type:request_rate:sum namespace:prod');
  });

  it('serializes every supported field and round-trips it', () => {
    const filter = {
      dataSourceNames: ['main', 'backup'],
      namespace: 'prod rules',
      groupName: 'api-v2',
      ruleName: 'Error:rate',
      ruleState: 'firing',
      ruleType: 'alerting',
      labels: ['team=platform', 'description=state:firing'],
    };
    const query = applySearchFilterToQuery('', filter);

    expect(query).toBe(
      'datasource:main datasource:backup namespace:"prod rules" group:api-v2 rule:Error:rate state:firing type:alerting label:team=platform label:description=state:firing'
    );
    expect(getSearchFilterFromQuery(query)).toEqual(filter);
  });

  it('does not let malformed original quotes swallow newly serialized filters', () => {
    const query = applySearchFilterToQuery('ErrorRate "unfinished state:firing', {
      ruleName: 'ErrorRate',
      namespace: 'prod',
      ruleState: 'pending',
    });

    expect(query).toBe('ErrorRate namespace:prod state:pending');
    expect(getSearchFilterFromQuery(query)).toEqual({
      ruleName: 'ErrorRate',
      namespace: 'prod',
      ruleState: 'pending',
    });
  });
});
