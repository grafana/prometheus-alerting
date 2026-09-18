import { bench, describe } from 'vitest';

import { countRouteMatches } from './routeMatching';
import {
  buildBalancedWorkload,
  buildMixedWorkload,
  buildDistinctLabelWorkload,
  buildOverlappingRegexWorkload,
  buildWideWorkload,
  type RouteMatchingWorkload,
} from './routeMatchingBenchmark.fixtures';

const BENCHMARK_OPTIONS = {
  iterations: 15,
  time: 500,
  warmupIterations: 3,
  warmupTime: 200,
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

const balancedRegex = buildBalancedWorkload({
  branchingFactor: 8,
  depth: 3,
  groupCount: 3_000,
  alertsPerGroup: 3,
  operator: '=~',
});

const wide = buildWideWorkload({
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

const mixed = buildMixedWorkload();
const distinctLabels = buildDistinctLabelWorkload();
const overlappingRegex = buildOverlappingRegexWorkload();
const continuedRegex = buildWideWorkload({
  childRouteCount: 499,
  groupCount: 1_000,
  alertsPerGroup: 3,
  operator: '=~',
  continueRoutes: true,
});
const nestedRegex = buildBalancedWorkload({
  branchingFactor: 16,
  depth: 2,
  groupCount: 1_024,
  alertsPerGroup: 4,
  operator: '=~',
});
assertWorkload(overlappingRegex, 481);
assertWorkload(continuedRegex, 500);
assertWorkload(nestedRegex, 273);
assertWorkload(mixed, 500);
assertWorkload(distinctLabels, 500);
assertWorkload(control, 31);
assertWorkload(representative, 585);
assertWorkload(balancedRegex, 585);
assertWorkload(wide, 500);
assertWorkload(regexHeavy, 500);
assertWorkload(regexWide20k, 500);
assertWorkload(regexWide30k, 500);

describe('countRouteMatches: uniformly distributed destinations', () => {
  addBenchmark('overlapping regex: 4 destinations per alert', overlappingRegex);
  addBenchmark('continued regex: uniformly distributed', continuedRegex);
  addBenchmark('nested regex: 16 siblings per level, 4,096 alerts', nestedRegex);
  addBenchmark('mixed operators: 500 routes, 3,000 unique routing values, four matchers', mixed);
  addBenchmark('distinct labels: 500 routes, 3,000 unique alerts, 499 label names', distinctLabels);
  addBenchmark('control: 31 routes, 100 unique alerts', control);
  addBenchmark('balanced equality: 585 routes, 9,000 unique alerts', representative);
  addBenchmark('balanced regex: 585 routes, 9,000 unique routing values', balancedRegex);
  addBenchmark('wide equality: 500 routes, 3,000 unique alerts', wide);
  addBenchmark('wide regex: 500 routes, 1,000 unique routing values', regexHeavy);
  addBenchmark('extreme regex: 500 routes, 20,000 unique routing values', regexWide20k);
  addBenchmark('extreme regex: 500 routes, 30,000 unique routing values', regexWide30k);
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
  const fingerprints = new Set(workload.alertGroups.flatMap((group) => group.alerts.map((alert) => alert.fingerprint)));
  if (fingerprints.size !== workload.alertOccurrenceCount || fingerprints.size !== workload.uniqueAlertCount) {
    throw new Error('Every benchmark alert must have a unique fingerprint');
  }

  const counts = countRouteMatches(workload.routeTree, workload.alertGroups);
  if (counts.size !== workload.expectedCounts.size) {
    throw new Error('Expected alerts to reach every destination policy without falling back to a parent');
  }
  for (const [id, expected] of workload.expectedCounts) {
    if (counts.get(id) !== expected) {
      throw new Error(`Expected ${expected} alerts at route ${id}, received ${counts.get(id) ?? 0}`);
    }
  }
}
