import { findMatchingRoutes, type LabelMatcher, type RouteWithID as GrafanaRouteWithID } from '@grafana/alerting';
import type { RouteWithID as AlertmanagerRouteWithID } from '@grafana/external-alertmanager/mimir';
import { normalizeMatchers, type AlertGroup, type ObjectMatcher } from '@grafana/external-alertmanager/vanilla';
import { describe, expect, it } from 'vitest';

import { AlertGroupFactory, GettableAlertFactory } from '../../alerts/mocks/alerts.fakes';
import { attachRouteIds } from '../utils';
import { countRouteMatches } from './routeMatching';

type ReferenceRoute = Omit<GrafanaRouteWithID, 'routes'> & {
  continue: boolean;
  matchers: LabelMatcher[];
  routes: ReferenceRoute[];
};

function toReferenceRoute(route: AlertmanagerRouteWithID): ReferenceRoute {
  return {
    id: route.id,
    continue: route.continue ?? false,
    matchers: normalizeMatchers(route).map(toLabelMatcher),
    routes: route.routes?.map(toReferenceRoute) ?? [],
  };
}

function toLabelMatcher([label, type, value]: ObjectMatcher): LabelMatcher {
  return { label, type, value };
}

function countRouteMatchesReference(
  routeTree: AlertmanagerRouteWithID | undefined,
  alertGroups: AlertGroup[]
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!routeTree || alertGroups.length === 0) {
    return counts;
  }

  const matchingTree = toReferenceRoute(routeTree);
  const seenFingerprints = new Set<string>();
  for (const group of alertGroups) {
    for (const alert of group.alerts) {
      if (seenFingerprints.has(alert.fingerprint)) {
        continue;
      }
      seenFingerprints.add(alert.fingerprint);
      for (const match of findMatchingRoutes(matchingTree, Object.entries(alert.labels))) {
        counts.set(match.route.id, (counts.get(match.route.id) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function expectEquivalent(routeTree: AlertmanagerRouteWithID | undefined, alertGroups: AlertGroup[]): void {
  let actualError: unknown;
  let referenceError: unknown;
  let actual: Map<string, number> | undefined;
  let reference: Map<string, number> | undefined;

  try {
    actual = countRouteMatches(routeTree, alertGroups);
  } catch (error) {
    actualError = error;
  }
  try {
    reference = countRouteMatchesReference(routeTree, alertGroups);
  } catch (error) {
    referenceError = error;
  }

  expect(actualError instanceof Error ? actualError.message : actualError).toEqual(
    referenceError instanceof Error ? referenceError.message : referenceError
  );
  expect(actual ? Array.from(actual.entries()) : actual).toEqual(
    reference ? Array.from(reference.entries()) : reference
  );
}

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

  it('matches the upstream adapter for ordered trees and all matcher representations', () => {
    const route = attachRouteIds({
      receiver: 'root',
      matchers: ['environment!="dev"'],
      routes: [
        {
          receiver: 'critical',
          matchers: ['severity="critical"', 'service=~"api.*"'],
          continue: true,
        },
        {
          receiver: 'not-ops',
          matchers: ['team!~"ops"'],
          routes: [{ receiver: 'legacy-regex', match_re: { service: 'worker|api' } }],
        },
        { receiver: 'legacy-equality', match: { team: 'platform' } },
      ],
    });
    const groups = [
      AlertGroupFactory.build({
        alerts: [
          GettableAlertFactory.build({
            fingerprint: 'one',
            labels: { environment: 'prod', severity: 'critical', service: 'api' },
          }),
          GettableAlertFactory.build({
            fingerprint: 'two',
            labels: { environment: 'prod', service: 'worker', team: 'backend' },
          }),
          GettableAlertFactory.build({
            fingerprint: 'three',
            labels: { environment: 'prod', service: '', team: 'platform' },
          }),
          GettableAlertFactory.build({
            fingerprint: 'four',
            labels: { environment: 'dev', severity: 'critical', service: 'api' },
          }),
        ],
      }),
      AlertGroupFactory.build({
        alerts: [
          GettableAlertFactory.build({ fingerprint: 'one', labels: { environment: 'dev' } }),
          GettableAlertFactory.build({ fingerprint: 'five', labels: { environment: 'prod', team: 'ops' } }),
        ],
      }),
    ];

    expectEquivalent(route, groups);
  });

  it('resets compiled global regex state between successive alerts', () => {
    const route = attachRouteIds({
      receiver: 'root',
      routes: [{ receiver: 'regex', matchers: ['service=~"(?i)api"'] }],
    });
    const groups = [
      AlertGroupFactory.build({
        alerts: [
          GettableAlertFactory.build({ fingerprint: 'first', labels: { service: 'API' } }),
          GettableAlertFactory.build({ fingerprint: 'second', labels: { service: 'api' } }),
          GettableAlertFactory.build({ fingerprint: 'third', labels: { service: 'API' } }),
        ],
      }),
    ];

    expectEquivalent(route, groups);
    expect(countRouteMatches(route, groups).get(route.routes![0].id)).toBe(3);
  });

  it('matches upstream invalid regex exception timing for visited and pruned routes', () => {
    const cases = [
      attachRouteIds({ receiver: 'root', routes: [{ receiver: 'invalid', matchers: ['service=~"["'] }] }),
      attachRouteIds({
        receiver: 'root',
        routes: [{ receiver: 'failed-first', matchers: ['team="platform"', 'service!~"["'] }],
      }),
      attachRouteIds({
        receiver: 'root',
        matchers: ['environment="prod"'],
        routes: [{ receiver: 'pruned-invalid', matchers: ['service=~"["'] }],
      }),
    ];
    const present = AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: { service: 'api' } })] });
    const absent = AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: { team: 'backend' } })] });
    const pruned = AlertGroupFactory.build({
      alerts: [GettableAlertFactory.build({ labels: { environment: 'dev', service: 'api' } })],
    });

    expectEquivalent(cases[0], [present]);
    expectEquivalent(cases[0], [absent]);
    expectEquivalent(cases[1], [present]);
    expectEquivalent(cases[2], [pruned]);
  });

  it('matches the upstream adapter across a bounded deterministic nested matrix', () => {
    const emptyGroup = AlertGroupFactory.build({ alerts: [] });
    const specialLabels = Object.fromEntries([
      ['__proto__', 'proto'],
      ['constructor', 'constructor'],
      ['toString', 'stringer'],
    ]);
    const cases = [
      {
        name: 'all operators with missing and empty labels',
        route: attachRouteIds({
          receiver: 'root',
          routes: [
            { receiver: 'equals', matchers: ['service="api"'], continue: true },
            { receiver: 'not-equals', matchers: ['missing!=""'], continue: true },
            { receiver: 'regex', matchers: ['team=~"platform|backend"'], continue: true },
            { receiver: 'not-regex', matchers: ['empty!~"value"'] },
          ],
        }),
        groups: [
          AlertGroupFactory.build({
            alerts: [
              GettableAlertFactory.build({
                fingerprint: 'empty',
                labels: { empty: '', service: 'api', team: 'backend' },
              }),
              GettableAlertFactory.build({ fingerprint: 'missing', labels: { service: 'worker', team: 'other' } }),
            ],
          }),
        ],
      },
      {
        name: 'nested child continue and non-continued leaf',
        route: attachRouteIds({
          receiver: 'root',
          routes: [
            {
              receiver: 'continued-child',
              continue: true,
              matchers: ['team="platform"'],
              routes: [{ receiver: 'first-leaf', matchers: ['service="api"'] }, { receiver: 'skipped-leaf' }],
            },
            { receiver: 'sibling', matchers: ['team="platform"'] },
          ],
        }),
        groups: [
          AlertGroupFactory.build({
            alerts: [GettableAlertFactory.build({ labels: { service: 'api', team: 'platform' } })],
          }),
        ],
      },
      {
        name: 'nested non-continued child and continued leaf',
        route: attachRouteIds({
          receiver: 'root',
          routes: [
            {
              receiver: 'stopping-child',
              matchers: ['team="platform"'],
              routes: [
                { receiver: 'continued-leaf', continue: true, matchers: ['service="api"'] },
                { receiver: 'fallback-leaf' },
              ],
            },
            { receiver: 'skipped-sibling', matchers: ['team="platform"'] },
          ],
        }),
        groups: [
          AlertGroupFactory.build({
            alerts: [GettableAlertFactory.build({ labels: { service: 'api', team: 'platform' } })],
          }),
        ],
      },
      {
        name: 'parent fallback and parent matcher pruning',
        route: attachRouteIds({
          receiver: 'root',
          routes: [
            {
              receiver: 'parent-fallback',
              matchers: ['team="platform"'],
              routes: [{ receiver: 'failed-child', matchers: ['service="api"'] }],
            },
            {
              receiver: 'pruned-parent',
              matchers: ['environment="prod"'],
              routes: [{ receiver: 'otherwise-matching-grandchild', matchers: ['service="api"'] }],
            },
          ],
        }),
        groups: [
          AlertGroupFactory.build({
            alerts: [
              GettableAlertFactory.build({ fingerprint: 'fallback', labels: { service: 'worker', team: 'platform' } }),
              GettableAlertFactory.build({
                fingerprint: 'pruned',
                labels: { environment: 'dev', service: 'api', team: 'other' },
              }),
            ],
          }),
        ],
      },
      {
        name: 'first duplicate fingerprint remains unmatched',
        route: attachRouteIds({ receiver: 'root', routes: [{ receiver: 'api', matchers: ['service="api"'] }] }),
        groups: [
          AlertGroupFactory.build({
            alerts: [GettableAlertFactory.build({ fingerprint: 'duplicate', labels: { service: 'worker' } })],
          }),
          AlertGroupFactory.build({
            alerts: [GettableAlertFactory.build({ fingerprint: 'duplicate', labels: { service: 'api' } })],
          }),
        ],
      },
      {
        name: 'anchoring alternation and newlines',
        route: attachRouteIds({
          receiver: 'root',
          routes: [
            { receiver: 'alternation', matchers: ['service=~"api|worker"'], continue: true },
            { receiver: 'newline', matchers: ['message=~"(?s)line.*two"'] },
          ],
        }),
        groups: [
          AlertGroupFactory.build({
            alerts: [
              GettableAlertFactory.build({ fingerprint: 'anchored', labels: { service: 'api-worker' } }),
              GettableAlertFactory.build({
                fingerprint: 'newline',
                labels: { message: 'line one\ntwo', service: 'worker' },
              }),
            ],
          }),
        ],
      },
      {
        name: 'ordinary JSON own special keys',
        route: attachRouteIds({
          receiver: 'root',
          matchers: ['__proto__="proto"', 'constructor="constructor"', 'toString="stringer"'],
        }),
        groups: [AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: specialLabels })] })],
      },
      {
        name: 'own-enumerable invalid regex after a failed conjunct',
        route: attachRouteIds({
          receiver: 'root',
          routes: [{ receiver: 'invalid', matchers: ['team="platform"', '__proto__=~"["'] }],
        }),
        groups: [AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: specialLabels })] })],
      },
      {
        name: 'malformed unreachable branch is eager only with a group',
        route: attachRouteIds({
          receiver: 'root',
          routes: [{ receiver: 'unreachable', matchers: ['invalid'] }],
        }),
        groups: [emptyGroup],
      },
      {
        name: 'malformed tree is skipped for an empty groups array',
        route: attachRouteIds({
          receiver: 'root',
          routes: [{ receiver: 'unreachable', matchers: ['invalid'] }],
        }),
        groups: [],
      },
    ];

    for (const testCase of cases) {
      expectEquivalent(testCase.route, testCase.groups);
    }
  });

  it('uses fresh values for each alert when siblings share labels across all operators', () => {
    const route = attachRouteIds({
      receiver: 'root',
      routes: [
        { receiver: 'api', matchers: ['service=~"(?i)api-[0-9]+"'], continue: true },
        { receiver: 'not-worker', matchers: ['service!~"worker-[0-9]+"'], continue: true },
        { receiver: 'empty', matchers: ['service!="blocked"', 'service=""'] },
      ],
    });
    const alerts = ['API-1', 'worker-2', 'blocked', '', undefined, 'api-5'].map((service) =>
      GettableAlertFactory.build({ labels: service === undefined ? {} : { service } })
    );
    const groups = [
      AlertGroupFactory.build({ alerts: alerts.slice(0, 3) }),
      AlertGroupFactory.build({
        alerts: [
          ...alerts.slice(3),
          GettableAlertFactory.build({ fingerprint: alerts[0].fingerprint, labels: { service: 'worker-99' } }),
        ],
      }),
    ];
    expectEquivalent(route, groups);
    const counts = countRouteMatches(route, groups);
    expect(counts.get(route.routes![0].id)).toBe(2);
    expect(counts.get(route.routes![1].id)).toBe(5);
    expect(counts.get(route.routes![2].id)).toBe(2);
    expect(counts.get(route.id)).toBe(1);
  });

  it('keeps an invalid negative regex false for missing labels and throws for present-empty labels', () => {
    const route = attachRouteIds({
      receiver: 'root',
      routes: [{ receiver: 'invalid', matchers: ['service!~"["'] }],
    });
    const absent = AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: {} })] });
    const empty = AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: { service: '' } })] });
    expectEquivalent(route, [absent]);
    expect(countRouteMatches(route, [absent])).toEqual(new Map([[route.id, 1]]));
    expectEquivalent(route, [absent, empty]);
    expect(() => countRouteMatches(route, [absent, empty])).toThrow();
  });

  it('does not evaluate matchers on siblings skipped by a non-continued match', () => {
    const route = attachRouteIds({
      receiver: 'root',
      routes: [
        { receiver: 'first', matchers: ['service="api"'] },
        { receiver: 'skipped-invalid', matchers: ['service=~"["'] },
      ],
    });
    const groups = [
      AlertGroupFactory.build({ alerts: GettableAlertFactory.buildList(2, { labels: { service: 'api' } }) }),
    ];
    expectEquivalent(route, groups);
    expect(countRouteMatches(route, groups)).toEqual(new Map([[route.routes![0].id, 2]]));
  });

  it('returns no counts without a tree or alerts', () => {
    expect(countRouteMatches(undefined, [])).toEqual(new Map());
    expect(countRouteMatches(attachRouteIds({ receiver: 'default' }), [])).toEqual(new Map());
  });
});

describe('wide regex routing semantics', () => {
  function wideTree() {
    return attachRouteIds({
      receiver: 'root',
      routes: Array.from({ length: 40 }, (_, index) => ({
        receiver: `route-${index}`,
        matchers: [`service=~"svc-${index}-[0-9]+"`],
      })),
    });
  }

  it.each(['constructor', 'toString', '__proto__'])('handles absent and own prototype-named labels: %s', (label) => {
    const route = wideTree();
    for (const [index, child] of route.routes!.entries()) {
      child.matchers = [`${label}=~"svc-${index}-[0-9]+"`];
    }
    const labels: Record<string, string> = {};
    Object.defineProperty(labels, label, { value: 'svc-39-9', enumerable: true });
    expectEquivalent(route, [
      AlertGroupFactory.build({
        alerts: [
          GettableAlertFactory.build({ fingerprint: 'absent', labels: {} }),
          GettableAlertFactory.build({ fingerprint: 'own', labels }),
        ],
      }),
    ]);
  });

  it('keeps sibling order, all conjuncts, continue, nesting, fallback, and fingerprint deduplication', () => {
    const route = wideTree();
    const children = route.routes!;
    children[3].continue = true;
    children[7].matchers = ['service=~"svc-3-[0-9]+"', 'team="platform"'];
    children[7].continue = true;
    children[7].routes = attachRouteIds({
      receiver: 'nested-root',
      routes: [{ receiver: 'nested', matchers: ['level="critical"'] }],
    }).routes;
    children[20].matchers = ['service=~"svc-3-[0-9]+"'];
    const alerts = [
      { service: 'svc-3-123', team: 'platform', level: 'critical' },
      { service: 'svc-3-456', team: 'other' },
      { service: 'svc-3-text', team: 'platform' },
      { service: 'unknown' },
      {},
      { service: '' },
      { service: 'svc-39-9' },
    ].map((labels, index) => GettableAlertFactory.build({ fingerprint: `wide-${index}`, labels }));
    const groups = [AlertGroupFactory.build({ alerts: [...alerts, alerts[0]] })];
    expectEquivalent(route, groups);
    expect([...countRouteMatches(route, groups).keys()]).toEqual([
      children[3].id,
      children[7].routes![0].id,
      children[20].id,
      route.id,
      children[39].id,
    ]);
  });

  it.each([
    ['service=~"svc-0.*|other"', { service: 'other' }],
    ['service=~"svc-0?"', { service: 'svc-' }],
    ['service=~"(?i)svc-0.*"', { service: 'SVC-0-1' }],
    ['service=~"(?m)svc-0.*"', { service: 'other\nsvc-0-1' }],
    ['service!~"svc-0.*"', { service: 'other' }],
    ['service=~".*"', {}],
    ['other=~"svc-0.*"', { other: 'svc-0-1' }],
    ['service=~"["', { service: 'svc-1-1' }],
  ])('matches upstream for varied and invalid sibling regexes: %s', (matcher, labels) => {
    const route = wideTree();
    route.routes![0].matchers = [matcher];
    expectEquivalent(route, [AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels })] })]);
  });

  it('preserves visited invalid diagnostics among overlapping siblings', () => {
    const route = wideTree();
    for (const child of route.routes!) {
      child.matchers = ['service=~"shared-[0-9]+"'];
    }
    const groups = [
      AlertGroupFactory.build({ alerts: [GettableAlertFactory.build({ labels: { service: 'shared-1' } })] }),
    ];
    expectEquivalent(route, groups);
    route.routes![0].matchers = ['team="no"', 'service=~"["'];
    expectEquivalent(route, groups);
    route.routes![0].matchers = ['service=~"shared-[0-9]+"'];
    route.routes![1].matchers = ['service=~"["'];
    expectEquivalent(route, groups);
  });

  it('matches upstream on deterministic selective trees with collisions and varied regex tails', () => {
    const suffixes = ['[0-9]+', '.*', '[ab]*', '.?', '[^x]+'];
    const suffixValues = ['123', 'abc', '', 'x', 'a', '\n'];
    let state = 97183;
    const random = (max: number) => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state >>> 8) % max;
    };
    for (let trial = 0; trial < 100; trial++) {
      const route = attachRouteIds({
        receiver: 'root',
        routes: Array.from({ length: 48 }, (_, index) => ({
          receiver: `route-${index}`,
          object_matchers: [
            ['service', '=~', `service-${Math.floor(index / 3)}-${suffixes[random(suffixes.length)]}`],
            ['team', '!=', random(2) ? 'blocked' : 'other'],
          ] satisfies ObjectMatcher[],
          continue: random(3) !== 0,
          routes: random(4) === 0 ? [{ receiver: 'nested', matchers: ['level="critical"'] }] : undefined,
        })),
      });
      if (trial % 5 === 0) {
        route.routes![3].id = route.routes![0].id;
      }
      const alerts = Array.from({ length: 40 }, (_, index) =>
        GettableAlertFactory.build({
          fingerprint: `alert-${index % 37}`,
          labels: {
            service: `service-${random(18)}-${suffixValues[random(suffixValues.length)]}`,
            team: random(2) ? 'platform' : 'other',
            level: random(2) ? 'critical' : 'warning',
          },
        })
      );
      expectEquivalent(route, [AlertGroupFactory.build({ alerts })]);
    }
  });
});
