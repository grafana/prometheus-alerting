import type { RouteWithID } from '@grafana/external-alertmanager/mimir';
import type { AlertGroup, GettableAlert, Route } from '@grafana/external-alertmanager/vanilla';

import { attachRouteIds } from '../utils';

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

type MatcherOperator = '=' | '=~';

export interface RouteMatchingWorkload {
  alertGroups: AlertGroup[];
  alertOccurrenceCount: number;
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
    labelsForAlert: (index) => buildBalancedLabels(index, branchingFactor, depth),
  });

  return {
    ...alerts,
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
  const targetRoute = childRouteCount - 1;
  const routeTree = attachRouteIds({
    receiver: 'root',
    routes: Array.from(
      { length: childRouteCount },
      (_, index): Route => ({
        receiver: `route-${index}`,
        matchers: [`route_index${operator}"${index}"`],
        continue: continueRoutes,
      })
    ),
  });
  const alerts = buildAlertGroups({
    alertsPerGroup,
    extraLabelCount,
    groupCount,
    uniqueAlertCount,
    labelsForAlert: () => ({ route_index: String(targetRoute) }),
  });

  return {
    ...alerts,
    routeCount: countRoutes(routeTree),
    routeTree,
  };
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
        matchers: [`level_${level}${operator}"branch-${branch}"`],
        continue: continueRoutes,
        ...(routes.length > 0 ? { routes } : {}),
      };
    });
  }

  return buildLevel(0, []);
}

function buildBalancedLabels(index: number, branchingFactor: number, depth: number): Record<string, string> {
  return Object.fromEntries(
    Array.from({ length: depth }, (_, level) => [
      `level_${level}`,
      `branch-${Math.floor(index / branchingFactor ** level) % branchingFactor}`,
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
