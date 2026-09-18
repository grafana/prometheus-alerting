import { describe, expect, it } from 'vitest';

import { countRouteMatches } from './routeMatchingTest.utils';
import {
  buildBalancedWorkload,
  buildDistinctLabelWorkload,
  buildMixedWorkload,
  buildOverlappingRegexWorkload,
  buildWideWorkload,
} from './routeMatchingBenchmark.fixtures';

const operators = ['=', '=~'] satisfies Array<'=' | '=~'>;

describe('route matching benchmark fixtures', () => {
  it('distributes distinct alerts across overlapping continued regex destinations', () => {
    const workload = buildOverlappingRegexWorkload();
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    expect(new Set(alerts.map((alert) => alert.fingerprint)).size).toBe(480);
    expect(new Set(alerts.map((alert) => alert.labels.route_index)).size).toBe(480);
    expect(workload.routeCount).toBe(481);
    expect(workload.expectedCounts.size).toBe(480);
    expect([...workload.expectedCounts.values()].every((count) => count === 4)).toBe(true);
    expect(workload.routeTree.routes?.every((route) => route.continue)).toBe(true);
    expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
  });
  it.each(operators)('distributes wide %s workloads evenly, including the remainder', (operator) => {
    const workload = buildWideWorkload({
      childRouteCount: 3,
      groupCount: 2,
      alertsPerGroup: 2,
      operator,
    });
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    const routes = workload.routeTree.routes ?? [];
    expect(workload.routeCount).toBe(4);
    expect(workload.uniqueAlertCount).toBe(4);
    expect(new Set(alerts.map((alert) => alert.fingerprint)).size).toBe(alerts.length);
    expect(alerts.map((alert) => alert.labels.route_index)).toEqual(
      operator === '='
        ? ['0', '1', '2', '0']
        : ['route-0-instance-0', 'route-1-instance-1', 'route-2-instance-2', 'route-0-instance-3']
    );
    expect(workload.expectedCounts).toEqual(new Map(routes.map((route, index) => [route.id, index === 0 ? 2 : 1])));
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it.each(operators)('distributes balanced %s workloads evenly across leaves', (operator) => {
    const workload = buildBalancedWorkload({
      branchingFactor: 3,
      depth: 2,
      groupCount: 5,
      alertsPerGroup: 2,
      operator,
    });
    const leaves = workload.routeTree.routes?.flatMap((route) => route.routes ?? []) ?? [];
    expect(workload.routeCount).toBe(13);
    expect(leaves).toHaveLength(9);
    expect(workload.expectedCounts).toEqual(new Map(leaves.map((route, index) => [route.id, index === 0 ? 2 : 1])));
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    expect(new Set(alerts.map((alert) => alert.fingerprint)).size).toBe(10);
    if (operator === '=~') {
      for (const label of ['level_0', 'level_1']) {
        expect(new Set(alerts.map((alert) => alert.labels[label])).size).toBe(10);
      }
    }
  });

  it('keeps every routing value unique in the distributed extreme regex case', () => {
    const workload = buildWideWorkload({
      childRouteCount: 499,
      groupCount: 10_000,
      alertsPerGroup: 3,
      operator: '=~',
    });
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    expect(new Set(alerts.map((alert) => alert.labels.route_index)).size).toBe(30_000);
    expect(workload.expectedCounts.size).toBe(499);
    expect([...workload.expectedCounts.values()].filter((count) => count === 61)).toHaveLength(60);
    expect([...workload.expectedCounts.values()].filter((count) => count === 60)).toHaveLength(439);
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it('builds deterministic duplicate fixtures for correctness tests', () => {
    const workload = buildBalancedWorkload({
      branchingFactor: 2,
      depth: 2,
      groupCount: 3,
      alertsPerGroup: 2,
      uniqueAlertCount: 4,
      extraLabelCount: 1,
      continueRoutes: true,
    });
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    expect(workload.alertOccurrenceCount).toBe(6);
    expect(workload.uniqueAlertCount).toBe(4);
    expect(alerts[4]).toEqual(alerts[0]);
    expect(alerts[3].labels).toMatchObject({
      level_0: 'branch-1',
      level_1: 'branch-1',
      extra_label_0: 'value-0',
    });
    expect(workload.routeTree.routes?.[0].continue).toBe(true);
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
    expect([...workload.expectedCounts.values()]).toEqual([1, 1, 1, 1]);
  });

  it('leaves unused policies out of the expected map when there are fewer alerts than policies', () => {
    const workload = buildWideWorkload({ childRouteCount: 3, groupCount: 1, alertsPerGroup: 2 });
    expect(workload.expectedCounts.size).toBe(2);
    expect([...workload.expectedCounts.values()]).toEqual([1, 1]);
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it('treats a matcher-free root as the destination when the tree has no children', () => {
    const workload = buildBalancedWorkload({ branchingFactor: 2, depth: 0, groupCount: 1, alertsPerGroup: 2 });
    expect(workload.expectedCounts).toEqual(new Map([[workload.routeTree.id, 2]]));
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it('keeps mixed-operator workloads uniformly distributed with distinct regex inputs', () => {
    const workload = buildMixedWorkload();
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    expect(new Set(alerts.map((alert) => alert.labels.route_index)).size).toBe(3_000);
    expect(workload.routeTree.routes?.[0].matchers).toEqual([
      'environment="prod"',
      'region!="test"',
      'severity!~"info|debug"',
      'route_index=~"route-0-instance-[0-9]+"',
    ]);
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it('keeps sparse, distinct label names uniformly distributed', () => {
    const workload = buildDistinctLabelWorkload();
    expect(new Set(workload.routeTree.routes?.flatMap((route) => route.matchers ?? [])).size).toBe(499);
    const alerts = workload.alertGroups.flatMap((group) => group.alerts);
    for (const alert of [alerts[0], alerts[498], alerts[499]]) {
      expect(Object.keys(alert.labels).filter((name) => name.startsWith('policy_'))).toEqual([
        `policy_${alert.labels.route_index}`,
      ]);
    }
    expect(countRouteMatches(workload.routeTree, workload.alertGroups)).toEqual(workload.expectedCounts);
  });

  it.each([0, 3])('rejects invalid unique alert counts: %s', (uniqueAlertCount) => {
    expect(() => buildWideWorkload({ childRouteCount: 2, groupCount: 1, alertsPerGroup: 2, uniqueAlertCount })).toThrow(
      'uniqueAlertCount must be between 1 and the total number of alert occurrences'
    );
  });
});
