import { describe, expect, it } from 'vitest';

import type { CloudRuleIdentifier, PrometheusRuleIdentifier } from './identifier';
import { parseIdentifier, stringifyIdentifier } from './serialization';

const prometheusIdentifier: PrometheusRuleIdentifier = {
  type: 'prometheus',
  uid: 'prom-uid',
  namespace: 'my-namespace',
  groupName: 'my-group',
  ruleName: 'my-rule',
  ruleHash: 'abc123',
};

const cloudIdentifier: CloudRuleIdentifier = {
  type: 'cloud',
  uid: 'mimir-uid',
  namespace: 'my-namespace',
  groupName: 'my-group',
  ruleName: 'my-rule',
  rulerRuleHash: 'def456',
};

describe('stringifyIdentifier / parseIdentifier', () => {
  it.each([
    ['prometheus', prometheusIdentifier],
    ['cloud', cloudIdentifier],
  ])('round-trips a %s identifier', (_type, identifier) => {
    expect(parseIdentifier(stringifyIdentifier(identifier))).toEqual(identifier);
  });

  it('round-trips names containing separators and path characters', () => {
    const identifier: PrometheusRuleIdentifier = {
      ...prometheusIdentifier,
      namespace: 'costs $ / month',
      groupName: 'windows\\group',
    };

    expect(parseIdentifier(stringifyIdentifier(identifier))).toEqual(identifier);
  });

  it('round-trips a URI-encoded identifier', () => {
    const encoded = encodeURIComponent(stringifyIdentifier(cloudIdentifier));

    expect(parseIdentifier(encoded, true)).toEqual(cloudIdentifier);
  });

  it.each([
    ['too few parts', 'pri$prom-uid$my-namespace'],
    ['too many parts', 'pri$prom-uid$my-namespace$my-group$my-rule$abc123$extra'],
    ['an unknown prefix', 'nope$prom-uid$my-namespace$my-group$my-rule$abc123'],
    ['no separators at all', 'totally-bogus-identifier'],
    ['an empty string', ''],
  ])('returns null for an identifier with %s', (_reason, value) => {
    expect(parseIdentifier(value)).toBeNull();
  });

  it('returns null for a broken percent-escape instead of throwing', () => {
    expect(parseIdentifier('%E0%A4%A', true)).toBeNull();
    expect(parseIdentifier('%', true)).toBeNull();
  });
});
