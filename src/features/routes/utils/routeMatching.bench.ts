import { bench, describe } from 'vitest';

import { countRouteMatches } from './routeMatching';
import {
  buildBalancedWorkload,
  buildWideWorkload,
  type RouteMatchingWorkload,
} from './routeMatchingBenchmark.fixtures';

const BENCHMARK_OPTIONS = {
  iterations: 5,
  time: 0,
  warmupIterations: 1,
  warmupTime: 0,
};

const control = buildBalancedWorkload({
  branchingFactor: 5,
  depth: 2,
  groupCount: 100,
  alertsPerGroup: 1,
});

const representative = buildBalancedWorkload({
  branchingFactor: 8,
  depth: 3,
  groupCount: 3_000,
  alertsPerGroup: 3,
});

const duplicateHeavy = buildBalancedWorkload({
  branchingFactor: 8,
  depth: 3,
  groupCount: 3_000,
  alertsPerGroup: 3,
  uniqueAlertCount: 900,
});

const wideLateMatch = buildWideWorkload({
  childRouteCount: 499,
  groupCount: 1_000,
  alertsPerGroup: 3,
});

const regexHeavy = buildWideWorkload({
  childRouteCount: 499,
  groupCount: 500,
  alertsPerGroup: 2,
  operator: '=~',
});

const regexWide20k = buildWideWorkload({
  childRouteCount: 499,
  groupCount: 10_000,
  alertsPerGroup: 2,
  operator: '=~',
});

const regexWide30k = buildWideWorkload({
  childRouteCount: 499,
  groupCount: 10_000,
  alertsPerGroup: 3,
  operator: '=~',
});

assertWorkload(control, 31);
assertWorkload(representative, 585);
assertWorkload(duplicateHeavy, 585);
assertWorkload(wideLateMatch, 500);
assertWorkload(regexHeavy, 500);
assertWorkload(regexWide20k, 500);
assertWorkload(regexWide30k, 500);

describe('countRouteMatches', () => {
  addBenchmark('control: 31 routes, 100 unique alerts', control);
  addBenchmark('representative: 585 routes, 3,000 groups, 9,000 unique alerts', representative);
  addBenchmark('duplicate-heavy: 585 routes, 9,000 occurrences, 900 unique alerts', duplicateHeavy);
  addBenchmark('wide late match: 500 routes, 3,000 unique alerts', wideLateMatch);
  addBenchmark('regex-heavy late match: 500 routes, 1,000 unique alerts', regexHeavy);
  addBenchmark('extreme regex: 500 routes, 20,000 unique alerts, late match', regexWide20k);
  addBenchmark('extreme regex: 500 routes, 30,000 unique alerts, late match', regexWide30k);
});

function addBenchmark(name: string, workload: RouteMatchingWorkload): void {
  bench(
    name,
    () => {
      const counts = countRouteMatches(workload.routeTree, workload.alertGroups);
      if (counts.size === 0) {
        throw new Error('Expected the workload to produce route counts');
      }
    },
    BENCHMARK_OPTIONS
  );
}

function assertWorkload(workload: RouteMatchingWorkload, expectedRouteCount: number): void {
  if (workload.routeCount !== expectedRouteCount) {
    throw new Error(`Expected ${expectedRouteCount} routes, received ${workload.routeCount}`);
  }
  if (workload.alertOccurrenceCount < workload.uniqueAlertCount) {
    throw new Error('Unique alerts cannot exceed alert occurrences');
  }

  const counts = countRouteMatches(workload.routeTree, workload.alertGroups);
  const totalMatches = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  if (totalMatches !== workload.uniqueAlertCount) {
    throw new Error(`Expected ${workload.uniqueAlertCount} matched alerts, received ${totalMatches}`);
  }
}
