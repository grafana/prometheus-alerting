import { findMatchingRoutes, type LabelMatcher, type RouteWithID as GrafanaRouteWithID } from '@grafana/alerting';
import type { RouteWithID } from '@grafana/external-alertmanager/mimir';
import {
  AlertGroupsSchema,
  normalizeMatchers,
  ParsedAlertmanagerConfigSchema,
} from '@grafana/external-alertmanager/vanilla';
import { describe, expect, it } from 'vitest';

import { countRouteMatches } from './routeMatching';
import {
  buildProductPlatformWorkload,
  buildLargePlatformWorkload,
  buildMultiTenantWorkload,
  buildIncidentResponseWorkload,
  buildRealisticRouteMatchingWorkloads,
} from './routeMatchingRealistic.fixtures';

type ReferenceRoute = Omit<GrafanaRouteWithID, 'routes'> & {
  continue: boolean;
  matchers: LabelMatcher[];
  routes: ReferenceRoute[];
};

function referenceRoute(route: RouteWithID): ReferenceRoute {
  return {
    id: route.id,
    continue: route.continue ?? false,
    matchers: normalizeMatchers(route).map(([label, type, value]) => ({ label, type, value })),
    routes: route.routes?.map(referenceRoute) ?? [],
  };
}

describe('realistic Alertmanager workloads', () => {
  it.each([100, 500, 2000])(
    'validates every destination in a %s-policy platform against upstream',
    (policies) => {
      const workload = buildLargePlatformWorkload(policies, 10_000);
      const reference = referenceRoute(workload.routeTree);
      expect(workload.routeCount).toBe(policies);
      expect(ParsedAlertmanagerConfigSchema.safeParse(workload.config).success).toBe(true);
      expect(AlertGroupsSchema.safeParse(workload.alertGroups).success).toBe(true);
      const seen = new Set<string>();
      const labels = new Set<string>();
      for (const group of workload.alertGroups) {
        for (const alert of group.alerts) {
          if (seen.has(alert.fingerprint)) {
            continue;
          }
          seen.add(alert.fingerprint);
          labels.add(JSON.stringify(alert.labels));
          expect(findMatchingRoutes(reference, Object.entries(alert.labels)).map((match) => match.route.id)).toEqual(
            workload.expectedRouteIdsByFingerprint.get(alert.fingerprint)
          );
        }
      }
      expect(seen.size).toBe(10_000);
      expect(labels.size).toBe(10_000);
      expect(workload.expectedCounts.size).toBe(policies);
      expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
    },
    120_000
  );

  it.each([8, 9, 10])('supports partially populated final tenants at %s policies', (policies) => {
    const workload = buildLargePlatformWorkload(policies, 100);
    const reference = referenceRoute(workload.routeTree);
    expect(workload.routeCount).toBe(policies);
    for (const group of workload.alertGroups) {
      for (const alert of group.alerts) {
        expect(findMatchingRoutes(reference, Object.entries(alert.labels)).map((match) => match.route.id)).toEqual(
          workload.expectedRouteIdsByFingerprint.get(alert.fingerprint)
        );
      }
    }
    expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
  });

  it.each([0, 7, 8.5, Number.NaN])('rejects invalid large policy count %s', (count) => {
    expect(() => buildLargePlatformWorkload(count, 10)).toThrow(RangeError);
  });

  it.each(buildRealisticRouteMatchingWorkloads(3000))(
    '$name matches every hand-authored destination against upstream',
    (workload) => {
      const reference = referenceRoute(workload.routeTree);
      expect(ParsedAlertmanagerConfigSchema.safeParse(workload.config).success).toBe(true);
      expect(AlertGroupsSchema.safeParse(workload.alertGroups).success).toBe(true);
      const seen = new Set<string>();
      const labelSets = new Set<string>();
      const counts = new Map<string, number>();
      for (const group of workload.alertGroups) {
        for (const alert of group.alerts) {
          for (const [name, value] of Object.entries(group.labels)) {
            expect(alert.labels[name]).toBe(value);
          }
          expect(alert.receivers).toContainEqual(group.receiver);
          if (seen.has(alert.fingerprint)) {
            continue;
          }
          seen.add(alert.fingerprint);
          labelSets.add(JSON.stringify(alert.labels));
          expect(alert.fingerprint).toMatch(/^[0-9a-f]{16}$/);
          const matches = findMatchingRoutes(reference, Object.entries(alert.labels)).map((match) => match.route.id);
          expect(matches).toEqual(workload.expectedRouteIdsByFingerprint.get(alert.fingerprint));
          for (const id of matches) {
            counts.set(id, (counts.get(id) ?? 0) + 1);
          }
        }
      }
      expect(seen.size).toBe(3000);
      expect(labelSets.size).toBe(3000);
      expect(workload.alertOccurrenceCount).toBeGreaterThan(workload.uniqueAlertCount);
      expect([...counts]).toEqual([...workload.expectedCounts]);
      expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...counts]);
      expect(JSON.stringify(workload.config)).not.toContain('"key":');
      expect(new Set(workload.config.receivers.map((receiver) => receiver.name)).size).toBe(
        workload.config.receivers.length
      );
    }
  );

  it('is deterministic independently of factory sequence numbers and supports small samples', () => {
    expect(buildRealisticRouteMatchingWorkloads(24)).toEqual(buildRealisticRouteMatchingWorkloads(24));
    for (const size of [1, 24, 96]) {
      for (const workload of buildRealisticRouteMatchingWorkloads(size)) {
        expect(workload.uniqueAlertCount).toBe(size);
        expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
      }
    }
  });

  it('distinguishes route IDs even when platform and storage share a receiver', () => {
    const workload = buildIncidentResponseWorkload(300);
    const platform = workload.destinations.get('platform')!;
    const storage = workload.destinations.get('storage')!;
    expect(platform.receiver).toBe(storage.receiver);
    expect(platform.id).not.toBe(storage.id);
    expect(workload.expectedCounts.get(platform.id)).toBeGreaterThan(0);
    expect(workload.expectedCounts.get(storage.id)).toBeGreaterThan(0);
  });

  it('does not send a continued audit-only match to root fallback', () => {
    const workload = buildProductPlatformWorkload(30);
    const alert = workload.alertGroups
      .flatMap((group) => group.alerts)
      .find((alert) => alert.labels.team === 'identity')!;
    expect(workload.expectedRouteIdsByFingerprint.get(alert.fingerprint)).toEqual([
      workload.destinations.get('audit')!.id,
    ]);
  });

  it('keeps realistic hot tenants, idle root policy, and namespace fallback', () => {
    const workload = buildMultiTenantWorkload(3000);
    expect(workload.expectedCounts.get(workload.destinations.get('acme-warning')!.id)).toBeGreaterThan(
      workload.expectedCounts.get(workload.destinations.get('willow-warning')!.id)!
    );
    expect(workload.expectedCounts.has(workload.routeTree.id)).toBe(false);
    expect(workload.expectedCounts.get(workload.destinations.get('production')!.id)).toBeGreaterThan(0);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid alert count %s', (count) => {
    expect(() => buildProductPlatformWorkload(count)).toThrow(RangeError);
  });
});
