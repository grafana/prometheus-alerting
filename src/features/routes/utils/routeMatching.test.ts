import { describe, expect, it } from 'vitest';

import { AlertGroupFactory, GettableAlertFactory } from '../../alerts/mocks/alerts.fakes';
import { attachRouteIds } from '../utils';
import { countRouteMatches } from './routeMatching';

describe('countRouteMatches', () => {
  it('normalizes modern and legacy matchers without mutating the external tree', () => {
    const route = attachRouteIds({
      receiver: 'default',
      routes: [
        { receiver: 'modern', matchers: [' severity = "critical" '], continue: true },
        { receiver: 'legacy', match_re: { service: 'api.*' } },
      ],
    });
    const original = structuredClone(route);
    const group = AlertGroupFactory.build({
      alerts: [GettableAlertFactory.build({ labels: { severity: 'critical', service: 'api-worker' } })],
    });

    const counts = countRouteMatches(route, [group]);

    expect(counts.get(route.routes![0].id)).toBe(1);
    expect(counts.get(route.routes![1].id)).toBe(1);
    expect(route).toEqual(original);
  });

  it('throws for malformed matcher strings instead of turning a route into a catch-all', () => {
    const route = attachRouteIds({ receiver: 'child', matchers: ['invalid'] });

    expect(() => countRouteMatches(route, [AlertGroupFactory.build()])).toThrow('Invalid matcher');
  });

  it('deduplicates fingerprints and follows root fallback and continued routes', () => {
    const route = attachRouteIds({
      receiver: 'default',
      routes: [
        { receiver: 'critical', matchers: ['severity="critical"'], continue: true },
        { receiver: 'platform', matchers: ['team="platform"'] },
      ],
    });
    const criticalPlatform = GettableAlertFactory.build({
      fingerprint: 'critical-platform',
      labels: { alertname: 'CriticalPlatform', severity: 'critical', team: 'platform' },
    });
    const criticalBackend = GettableAlertFactory.build({
      fingerprint: 'critical-backend',
      labels: { alertname: 'CriticalBackend', severity: 'critical', team: 'backend' },
    });
    const warningBackend = GettableAlertFactory.build({
      fingerprint: 'warning-backend',
      labels: { alertname: 'WarningBackend', severity: 'warning', team: 'backend' },
    });
    const groups = [
      AlertGroupFactory.build({ alerts: [criticalPlatform, criticalBackend] }),
      AlertGroupFactory.build({ alerts: [criticalPlatform] }),
      AlertGroupFactory.build({ alerts: [warningBackend] }),
    ];

    const counts = countRouteMatches(route, groups);

    expect(counts.get(route.id)).toBe(1);
    expect(counts.get(route.routes![0].id)).toBe(2);
    expect(counts.get(route.routes![1].id)).toBe(1);
  });

  it('stops after the first matching sibling unless it continues', () => {
    const route = attachRouteIds({
      receiver: 'default',
      routes: [
        { receiver: 'first', matchers: ['severity="critical"'] },
        { receiver: 'second', matchers: ['severity="critical"'] },
      ],
    });
    const group = AlertGroupFactory.build({
      alerts: [GettableAlertFactory.build({ labels: { severity: 'critical' } })],
    });

    const counts = countRouteMatches(route, [group]);

    expect(counts.get(route.routes![0].id)).toBe(1);
    expect(counts.has(route.routes![1].id)).toBe(false);
  });

  it('returns no counts without a tree or alerts', () => {
    expect(countRouteMatches(undefined, [])).toEqual(new Map());
    expect(countRouteMatches(attachRouteIds({ receiver: 'default' }), [])).toEqual(new Map());
  });
});
