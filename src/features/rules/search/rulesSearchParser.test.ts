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
});
