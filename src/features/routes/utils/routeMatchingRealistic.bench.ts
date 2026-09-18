import { mkdirSync, writeFileSync } from 'node:fs';
import { bench, describe, expect } from 'vitest';

import { countRouteMatches } from './routeMatchingTest.utils';
import { buildRealisticRouteMatchingWorkloads } from './routeMatchingRealistic.fixtures';

// Optional, inspectable API-shaped snapshots; receiver stubs never send notifications.
if (process.env.ROUTE_MATCHING_EXPORT === '1') {
  const directory = 'benchmark-results/realistic-samples';
  mkdirSync(directory, { recursive: true });
  for (const workload of buildRealisticRouteMatchingWorkloads(96)) {
    writeFileSync(
      `${directory}/${workload.name}.json`,
      JSON.stringify(
        {
          name: workload.name,
          description: workload.description,
          uniqueAlertCount: workload.uniqueAlertCount,
          alertOccurrenceCount: workload.alertOccurrenceCount,
          alertmanagerConfig: workload.config,
          alertGroups: workload.alertGroups,
          expectedPolicies: [...workload.destinations].map(([policy, destination]) => ({
            policy,
            routeId: destination.id,
            receiver: destination.receiver,
            count: workload.expectedCounts.get(destination.id) ?? 0,
          })),
        },
        null,
        2
      ) + '\n'
    );
  }
}

describe('countRouteMatches: realistic operational scenarios', () => {
  for (const alertCount of [3_000, 30_000]) {
    for (const workload of buildRealisticRouteMatchingWorkloads(alertCount)) {
      // Fan-out deliberately repeats fingerprints between receiver groups.
      const fingerprints = new Set(
        workload.alertGroups.flatMap((group) => group.alerts.map((alert) => alert.fingerprint))
      );
      expect(fingerprints.size).toBe(alertCount);
      expect([...countRouteMatches(workload.routeTree, workload.alertGroups)]).toEqual([...workload.expectedCounts]);
      bench(
        `${workload.name}: ${workload.routeCount} routes, ${alertCount} unique / ${workload.alertOccurrenceCount} occurrences`,
        () => {
          const counts = countRouteMatches(workload.routeTree, workload.alertGroups);
          if (counts.size !== workload.expectedCounts.size) {
            throw new Error('Unexpected destination count');
          }
        },
        { iterations: 15, time: 500, warmupIterations: 3, warmupTime: 200 }
      );
    }
  }
});
