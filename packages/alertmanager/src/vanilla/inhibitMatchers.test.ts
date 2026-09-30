import { describe, expect, it } from 'vitest';

import { type InhibitRule } from './api/types/common';
import { normalizeInhibitRuleMatchers, type NormalizedInhibitRule } from './inhibitMatchers';
import { type ObjectMatcher } from './matchers.utils';

describe('normalizeInhibitRuleMatchers', () => {
  it('normalizes current source and target matcher syntax', () => {
    const rule: InhibitRule = {
      source_matchers: ['severity=critical', 'alertname=HostDown'],
      target_matchers: ['severity=warning', 'alertname!=HostDown'],
      equal: ['instance'],
    };

    expect(normalizeInhibitRuleMatchers(rule)).toMatchObject<NormalizedInhibitRule>({
      source_matchers: [
        ['severity', '=', 'critical'],
        ['alertname', '=', 'HostDown'],
      ],
      target_matchers: [
        ['severity', '=', 'warning'],
        ['alertname', '!=', 'HostDown'],
      ],
      equal: ['instance'],
    });
  });

  it('normalizes brace-contained comma-separated matchers', () => {
    expect(
      normalizeInhibitRuleMatchers({
        source_matchers: ['{ severity=critical, region=~"us-.*" }'],
        target_matchers: ['{ severity=warning, region!~"eu-.*" }'],
      })
    ).toMatchObject<NormalizedInhibitRule>({
      source_matchers: [
        ['severity', '=', 'critical'],
        ['region', '=~', 'us-.*'],
      ],
      target_matchers: [
        ['severity', '=', 'warning'],
        ['region', '!~', 'eu-.*'],
      ],
    });
  });

  it('retains empty matcher lists', () => {
    expect(normalizeInhibitRuleMatchers({ equal: ['instance'] })).toMatchObject({
      source_matchers: [],
      target_matchers: [],
      equal: ['instance'],
    });
  });

  it('appends deprecated regex maps before equality maps and removes them from the result', () => {
    const normalized = normalizeInhibitRuleMatchers({
      source_matchers: ['severity=critical'],
      source_match_re: { region: 'us-.*' },
      source_match: { instance: 'host-1' },
      target_match_re: { job: 'node-.*' },
      target_match: { severity: 'warning' },
    });

    expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([
      ['severity', '=', 'critical'],
      ['region', '=~', 'us-.*'],
      ['instance', '=', 'host-1'],
    ]);
    expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([
      ['job', '=~', 'node-.*'],
      ['severity', '=', 'warning'],
    ]);
    expect(normalized).not.toHaveProperty('source_match');
    expect(normalized).not.toHaveProperty('source_match_re');
    expect(normalized).not.toHaveProperty('target_match');
    expect(normalized).not.toHaveProperty('target_match_re');
  });

  it('keeps deprecated map values as already-semantic strings', () => {
    const normalized = normalizeInhibitRuleMatchers({
      source_match: { foo: String.raw`a\nb` },
      target_match_re: { baz: '日本語' },
    });

    expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([['foo', '=', String.raw`a\nb`]]);
    expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([['baz', '=~', '日本語']]);
  });
});
