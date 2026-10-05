import { describe, expect, it } from '@rstest/core';

import type { RouteMatches } from '@grafana/external-alertmanager/vanilla';
import { GettableAlertFactory } from '../../alerts/mocks/alerts.fakes';
import { countRouteMatches, getRouteMatchCount } from './useRouteMatching';

const matches: RouteMatches = new Map([
  ['route-a', GettableAlertFactory.buildList(2)],
  ['route-b', GettableAlertFactory.buildList(1)],
]);

describe('countRouteMatches', () => {
  it('reduces matched instances to a count per route', () => {
    expect(countRouteMatches(matches)).toEqual(
      new Map([
        ['route-a', 2],
        ['route-b', 1],
      ])
    );
  });

  it('returns no counts for no matches', () => {
    expect(countRouteMatches(new Map())).toEqual(new Map());
  });
});

describe('getRouteMatchCount', () => {
  it('reads a route count and defaults unmatched routes to zero', () => {
    const counts = countRouteMatches(matches);

    expect(getRouteMatchCount(counts, 'route-a')).toBe(2);
    expect(getRouteMatchCount(counts, 'route-missing')).toBe(0);
  });
});
