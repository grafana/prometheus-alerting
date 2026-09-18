import { bench, describe, expect } from 'vitest';

import { countRouteMatches } from './routeMatching';
import { buildLargePlatformWorkload } from './routeMatchingRealistic.fixtures';

const policyCounts = [100, 500, 2_000];
const alertCounts = [10_000, 30_000, 100_000];
if (process.env.ROUTE_MATCHING_REVERSE === '1') {
  policyCounts.reverse();
  alertCounts.reverse();
}

for (const policies of policyCounts) {
  for (const alerts of alertCounts) {
    describe(`${policies} policies / ${alerts} unique alerts`, () => {
      const workload = buildLargePlatformWorkload(policies, alerts);
      expect(workload.routeCount).toBe(policies);
      expect(workload.uniqueAlertCount).toBe(alerts);
      expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
      bench(
        'full count including matcher compilation',
        () => {
          countRouteMatches(workload.routeTree, workload.alertGroups);
        },
        { iterations: 25, time: 1_000, warmupIterations: 5, warmupTime: 300 }
      );
    });
  }
}
