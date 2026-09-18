import type { AlertGroup, GettableAlert, Route, RouteWithID } from '@grafana/external-alertmanager/vanilla';

import { attachRouteIds } from '../utils';

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

type MatcherOperator = '=' | '=~';

export interface RouteMatchingWorkload {
  alertGroups: AlertGroup[];
  alertOccurrenceCount: number;
  expectedCounts: Map<string, number>;
  routeCount: number;
  routeTree: RouteWithID;
  uniqueAlertCount: number;
}

interface AlertWorkloadOptions {
  alertsPerGroup: number;
  extraLabelCount: number;
  groupCount: number;
  labelsForAlert: (index: number) => Record<string, string>;
  uniqueAlertCount?: number;
}

interface BalancedWorkloadOptions {
  alertsPerGroup: number;
  branchingFactor: number;
  continueRoutes?: boolean;
  depth: number;
  extraLabelCount?: number;
  groupCount: number;
  operator?: MatcherOperator;
  uniqueAlertCount?: number;
}

interface WideWorkloadOptions {
  alertsPerGroup: number;
  childRouteCount: number;
  continueRoutes?: boolean;
  extraLabelCount?: number;
  groupCount: number;
  operator?: MatcherOperator;
  uniqueAlertCount?: number;
}

export function buildBalancedWorkload({
  alertsPerGroup,
  branchingFactor,
  continueRoutes = false,
  depth,
  extraLabelCount = 5,
  groupCount,
  operator = '=',
  uniqueAlertCount,
}: BalancedWorkloadOptions): RouteMatchingWorkload {
  const routeTree = attachRouteIds({
    receiver: 'root',
    routes: buildBalancedRoutes({ branchingFactor, continueRoutes, depth, operator }),
  });
  const alerts = buildAlertGroups({
    alertsPerGroup,
    extraLabelCount,
    groupCount,
    uniqueAlertCount,
    labelsForAlert: (index) => buildBalancedLabels(index, branchingFactor, depth, operator),
  });

  return {
    ...alerts,
    expectedCounts: buildExpectedCounts(routeTree, alerts.uniqueAlertCount),
    routeCount: countRoutes(routeTree),
    routeTree,
  };
}

export function buildWideWorkload({
  alertsPerGroup,
  childRouteCount,
  continueRoutes = false,
  extraLabelCount = 5,
  groupCount,
  operator = '=',
  uniqueAlertCount,
}: WideWorkloadOptions): RouteMatchingWorkload {
  const routeTree = attachRouteIds({
    receiver: 'root',
    routes: Array.from(
      { length: childRouteCount },
      (_, index): Route => ({
        receiver: `route-${index}`,
        matchers: [operator === '=' ? `route_index="${index}"` : `route_index=~"route-${index}-instance-[0-9]+"`],
        continue: continueRoutes,
      })
    ),
  });
  const alerts = buildAlertGroups({
    alertsPerGroup,
    extraLabelCount,
    groupCount,
    uniqueAlertCount,
    labelsForAlert: (index) => ({
      route_index:
        operator === '=' ? String(index % childRouteCount) : `route-${index % childRouteCount}-instance-${index}`,
    }),
  });

  return {
    ...alerts,
    expectedCounts: buildExpectedCounts(routeTree, alerts.uniqueAlertCount),
    routeCount: countRoutes(routeTree),
    routeTree,
  };
}

/** Exercise all four operators and multiple conjuncts without changing the destination distribution. */
export function buildMixedWorkload(): RouteMatchingWorkload {
  const workload = buildWideWorkload({
    childRouteCount: 499,
    groupCount: 1_000,
    alertsPerGroup: 3,
    operator: '=~',
  });
  for (const route of workload.routeTree.routes ?? []) {
    route.matchers = ['environment="prod"', 'region!="test"', 'severity!~"info|debug"', ...(route.matchers ?? [])];
  }
  for (const group of workload.alertGroups) {
    for (const alert of group.alerts) {
      Object.assign(alert.labels, { environment: 'prod', region: 'eu', severity: 'warning' });
    }
  }
  return workload;
}

/** Exercise many distinct label names; each alert supplies only its destination's label. */
export function buildDistinctLabelWorkload(): RouteMatchingWorkload {
  const workload = buildWideWorkload({ childRouteCount: 499, groupCount: 1_000, alertsPerGroup: 3 });
  for (const [index, route] of (workload.routeTree.routes ?? []).entries()) {
    route.matchers = [`policy_${index}="match"`];
  }
  for (const group of workload.alertGroups) {
    for (const alert of group.alerts) {
      alert.labels[`policy_${alert.labels.route_index}`] = 'match';
    }
  }
  return workload;
}

/** Four consecutive continued policies match each alert; every policy receives four alerts. */
export function buildOverlappingRegexWorkload(): RouteMatchingWorkload {
  const workload = buildWideWorkload({
    childRouteCount: 480,
    groupCount: 480,
    alertsPerGroup: 1,
    operator: '=~',
    continueRoutes: true,
  });
  const routes = workload.routeTree.routes ?? [];
  for (const [index, route] of routes.entries()) {
    route.matchers = [`route_index=~"route-${Math.floor(index / 4)}-instance-[0-9]+"`];
  }
  for (const [index, group] of workload.alertGroups.entries()) {
    group.alerts[0].labels.route_index = `route-${index % 120}-instance-${index}`;
  }
  workload.expectedCounts = new Map(routes.map((route) => [route.id, 4]));
  return workload;
}

function buildBalancedRoutes({
  branchingFactor,
  continueRoutes,
  depth,
  operator,
}: Pick<BalancedWorkloadOptions, 'branchingFactor' | 'continueRoutes' | 'depth' | 'operator'>): Route[] {
  function buildLevel(level: number, path: number[]): Route[] {
    if (level === depth) {
      return [];
    }

    return Array.from({ length: branchingFactor }, (_, branch): Route => {
      const childPath = [...path, branch];
      const routes = buildLevel(level + 1, childPath);

      return {
        receiver: `route-${childPath.join('-')}`,
        matchers: [
          operator === '=' ? `level_${level}="branch-${branch}"` : `level_${level}=~"branch-${branch}-instance-[0-9]+"`,
        ],
        continue: continueRoutes,
        ...(routes.length > 0 ? { routes } : {}),
      };
    });
  }

  return buildLevel(0, []);
}

function buildBalancedLabels(
  index: number,
  branchingFactor: number,
  depth: number,
  operator: MatcherOperator
): Record<string, string> {
  return Object.fromEntries(
    Array.from({ length: depth }, (_, level) => [
      `level_${level}`,
      `branch-${Math.floor(index / branchingFactor ** (depth - level - 1)) % branchingFactor}` +
        (operator === '=~' ? `-instance-${index}` : ''),
    ])
  );
}

function buildAlertGroups({
  alertsPerGroup,
  extraLabelCount,
  groupCount,
  labelsForAlert,
  uniqueAlertCount = groupCount * alertsPerGroup,
}: AlertWorkloadOptions): Pick<RouteMatchingWorkload, 'alertGroups' | 'alertOccurrenceCount' | 'uniqueAlertCount'> {
  const alertOccurrenceCount = groupCount * alertsPerGroup;
  if (uniqueAlertCount < 1 || uniqueAlertCount > alertOccurrenceCount) {
    throw new Error('uniqueAlertCount must be between 1 and the total number of alert occurrences');
  }

  const extraLabels = Object.fromEntries(
    Array.from({ length: extraLabelCount }, (_, index) => [`extra_label_${index}`, `value-${index}`])
  );
  const alerts = Array.from({ length: alertOccurrenceCount }, (_, occurrenceIndex) => {
    const uniqueIndex = occurrenceIndex % uniqueAlertCount;
    return buildAlert(uniqueIndex, { ...labelsForAlert(uniqueIndex), ...extraLabels });
  });
  const alertGroups = Array.from(
    { length: groupCount },
    (_, groupIndex): AlertGroup => ({
      labels: { benchmark_group: String(groupIndex) },
      receiver: { name: 'benchmark' },
      alerts: alerts.slice(groupIndex * alertsPerGroup, (groupIndex + 1) * alertsPerGroup),
    })
  );

  return { alertGroups, alertOccurrenceCount, uniqueAlertCount };
}

function buildAlert(index: number, labels: Record<string, string>): GettableAlert {
  return {
    fingerprint: `fingerprint-${index}`,
    labels: { alertname: `BenchmarkAlert-${index}`, ...labels },
    annotations: {},
    receivers: [{ name: 'benchmark' }],
    startsAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    endsAt: FIXED_TIMESTAMP,
    status: {
      state: 'active',
      silencedBy: [],
      inhibitedBy: [],
      mutedBy: [],
    },
  };
}

function countRoutes(route: RouteWithID): number {
  return 1 + (route.routes?.reduce((count, child) => count + countRoutes(child), 0) ?? 0);
}

// The generators visit destination policies round-robin in depth-first order.
// Derive expected counts arithmetically, independently of matcher evaluation.
function buildExpectedCounts(route: RouteWithID, uniqueAlertCount: number): Map<string, number> {
  function destinations(route: RouteWithID): string[] {
    return route.routes?.length ? route.routes.flatMap(destinations) : [route.id];
  }
  const ids = destinations(route);
  const counts = new Map<string, number>();
  for (const [index, id] of ids.entries()) {
    const count = Math.floor(uniqueAlertCount / ids.length) + (index < uniqueAlertCount % ids.length ? 1 : 0);
    if (count > 0) {
      counts.set(id, count);
    }
  }
  return counts;
}
