import { describe, expect, it } from 'vitest';
import type { AlertGroup, GettableAlert, LabelSet, Route } from './api/types/common';
import { getRouteMatches, matchAlertsToRoutes } from './routeMatching';
import { addUniqueIdentifierToRoute } from './routes.utils';

let alertCounter = 0;

function makeAlert(labels: LabelSet, fingerprint?: string): GettableAlert {
  alertCounter++;
  const timestamp = new Date(0).toISOString();

  return {
    fingerprint: fingerprint ?? `fingerprint-${alertCounter}`,
    labels,
    annotations: {},
    receivers: [{ name: 'default' }],
    startsAt: timestamp,
    updatedAt: timestamp,
    endsAt: timestamp,
    status: { state: 'active', silencedBy: [], inhibitedBy: [], mutedBy: [] },
  };
}

function makeGroup(...alerts: GettableAlert[]): AlertGroup {
  return {
    labels: {},
    receiver: { name: 'default' },
    alerts: alerts.length > 0 ? alerts : [makeAlert({ alertname: 'Alert' })],
  };
}

function makeTree(route: Route) {
  return addUniqueIdentifierToRoute(route);
}

describe('matchAlertsToRoutes', () => {
  it('records the instances that landed at each route', () => {
    const route = makeTree({
      receiver: 'default',
      routes: [
        { receiver: 'critical', matchers: ['severity="critical"'], continue: true },
        { receiver: 'platform', matchers: ['team="platform"'] },
      ],
    });
    const criticalPlatform = makeAlert({ severity: 'critical', team: 'platform' }, 'critical-platform');
    const criticalBackend = makeAlert({ severity: 'critical', team: 'backend' }, 'critical-backend');

    const matches = matchAlertsToRoutes(route, [makeGroup(criticalPlatform, criticalBackend)]);

    // `continue: true` on the first child means a critical/platform alert lands on both children
    expect(getRouteMatches(matches, route.routes![0].id)).toEqual([criticalPlatform, criticalBackend]);
    expect(getRouteMatches(matches, route.routes![1].id)).toEqual([criticalPlatform]);
    expect(getRouteMatches(matches, route.id)).toEqual([]);
  });

  it('normalizes modern and legacy matchers without mutating the external tree', () => {
    const route = makeTree({
      receiver: 'default',
      routes: [
        { receiver: 'modern', matchers: [' severity = "critical" '], continue: true },
        { receiver: 'legacy', match_re: { service: 'api.*' } },
      ],
    });
    const original = structuredClone(route);
    const group = makeGroup(makeAlert({ severity: 'critical', service: 'api-worker' }));

    const matches = matchAlertsToRoutes(route, [group]);

    expect(getRouteMatches(matches, route.routes![0].id)).toHaveLength(1);
    expect(getRouteMatches(matches, route.routes![1].id)).toHaveLength(1);
    expect(route).toEqual(original);
  });

  it('throws for malformed matcher strings instead of turning a route into a catch-all', () => {
    const route = makeTree({ receiver: 'child', matchers: ['invalid'] });

    expect(() => matchAlertsToRoutes(route, [makeGroup()])).toThrow('Invalid matcher');
  });

  it('deduplicates fingerprints and follows root fallback and continued routes', () => {
    const route = makeTree({
      receiver: 'default',
      routes: [
        { receiver: 'critical', matchers: ['severity="critical"'], continue: true },
        { receiver: 'platform', matchers: ['team="platform"'] },
      ],
    });
    const criticalPlatform = makeAlert(
      { alertname: 'CriticalPlatform', severity: 'critical', team: 'platform' },
      'critical-platform'
    );
    const criticalBackend = makeAlert(
      { alertname: 'CriticalBackend', severity: 'critical', team: 'backend' },
      'critical-backend'
    );
    const warningBackend = makeAlert(
      { alertname: 'WarningBackend', severity: 'warning', team: 'backend' },
      'warning-backend'
    );
    // criticalPlatform shows up in two groups and must only be counted once
    const groups = [
      makeGroup(criticalPlatform, criticalBackend),
      makeGroup(criticalPlatform),
      makeGroup(warningBackend),
    ];

    const matches = matchAlertsToRoutes(route, groups);

    expect(getRouteMatches(matches, route.id)).toHaveLength(1);
    expect(getRouteMatches(matches, route.routes![0].id)).toHaveLength(2);
    expect(getRouteMatches(matches, route.routes![1].id)).toHaveLength(1);
  });

  it('stops after the first matching sibling unless it continues', () => {
    const route = makeTree({
      receiver: 'default',
      routes: [
        { receiver: 'first', matchers: ['severity="critical"'] },
        { receiver: 'second', matchers: ['severity="critical"'] },
      ],
    });
    const group = makeGroup(makeAlert({ severity: 'critical' }));

    const matches = matchAlertsToRoutes(route, [group]);

    expect(getRouteMatches(matches, route.routes![0].id)).toHaveLength(1);
    expect(matches.has(route.routes![1].id)).toBe(false);
  });

  it('returns nothing without a tree or alerts', () => {
    expect(matchAlertsToRoutes(undefined, [])).toEqual(new Map());
    expect(matchAlertsToRoutes(makeTree({ receiver: 'default' }), [])).toEqual(new Map());
  });
});
