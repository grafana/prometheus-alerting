# Route matching benchmarks

These benchmarks measure the synchronous production path used to count unique alert instances for notification-policy routes. They include matcher parsing and compilation, fingerprint deduplication, traversal, and count-map construction.

## Run

```bash
pnpm bench:route-matching
```

Write machine-readable results for comparison:

```bash
pnpm bench:route-matching:json
pnpm exec vitest bench --run --config vitest.bench.config.ts \
  --compare benchmark-results/route-matching.json
```

The JSON output is ignored by Git. Compare implementations using the same fixtures on the same machine. Record the Node version, CPU, operating system, and `@grafana/alerting` version when sharing results.

## Synthetic stress workloads

In the synthetic suite, every benchmark alert has a different fingerprint and alert name. Alerts visit destination policies round-robin, and counts differ by at most one between policies. The overlapping-regex case selects four consecutive policies per alert. For nested trees, destination policies are leaves; parents receive no fallback alerts in these fixtures.

| Workload                                  | Total routes | Destination policies | Unique alerts | Alerts per destination |
| ----------------------------------------- | -----------: | -------------------: | ------------: | ---------------------: |
| Control, equality                         |           31 |                   25 |           100 |                      4 |
| Balanced, equality                        |          585 |                  512 |         9,000 |                  17–18 |
| Balanced, regex                           |          585 |                  512 |         9,000 |                  17–18 |
| Wide, equality                            |          500 |                  499 |         3,000 |                    6–7 |
| Mixed operators, four matchers per policy |          500 |                  499 |         3,000 |                    6–7 |
| Distinct matcher label names, equality    |          500 |                  499 |         3,000 |                    6–7 |
| Wide, regex                               |          500 |                  499 |         1,000 |                    2–3 |
| Extreme, regex                            |          500 |                  499 |        20,000 |                  40–41 |
| Extreme, regex                            |          500 |                  499 |        30,000 |                  60–61 |
| Nested regex, 16 siblings per level       |          273 |                  256 |         4,096 |                     16 |
| Continued, disjoint regex                 |          500 |                  499 |         3,000 |                    6–7 |
| Overlapping, continued regex              |          481 |                  480 |           480 |                      4 |

Equality workloads share the exact label values required by a policy. Regex workloads use a distinct routing-label value for every alert: e.g. `route-17-instance-516` matches `route-17-instance-[0-9]+`. Balanced regex workloads also use distinct values at every level. This exercises actual regex patterns without allowing a full routing-decision cache to hit just because multiple alerts select the same destination.

Fixtures are deterministic and built before measurement. Expected per-policy counts are calculated independently of matcher evaluation. Before timing, the harness verifies unique fingerprints and every destination's exact count, including the absence of unexpected parent fallbacks. Checking only the total count would miss a fixture that sends everything to one policy.

Each benchmark warms up for at least 200 ms and three iterations, then measures for at least 500 ms and 15 iterations. Do not introduce absolute CI timing thresholds without establishing normal variance.

The synthetic fixture builders can still generate duplicate fingerprints for correctness tests, but duplicate-heavy and all-alerts-to-one-policy cases are not part of the uniform stress suite.

The mixed-operator case combines equality, inequality, positive regex, and negative regex matchers. The distinct-label case uses 499 different matcher label names, with each alert supplying only the label for its destination policy. Both retain the same round-robin distribution.

The overlapping and nested cases exercise multiple destinations, sibling ordering, and nested routing.

## Realistic operational scenarios

These are hand-authored synthetic examples, **not anonymized production captures**. They intentionally complement, rather than replace, the evenly distributed stress suite. Definitions and generators live in `src/features/routes/utils/routeMatchingRealistic.fixtures.ts`; correctness tests and a separate `.bench.ts` are beside it.

| Scenario          | Routes | Policy structure                                                                                                           | 3,000 unique alerts appear in groups | 30,000 unique alerts appear in groups |
| ----------------- | -----: | -------------------------------------------------------------------------------------------------------------------------- | -----------------------------------: | ------------------------------------: |
| Product platform  |     12 | Commerce/data teams, staging bypass, critical audit fan-out, infrastructure escalation and fallbacks                       |                    4,499 occurrences |                    44,998 occurrences |
| Managed tenants   |     77 | 24 namespace prefixes with severity children, central on-call fan-out and unknown-namespace fallback                       |                    3,805 occurrences |                    38,016 occurrences |
| Incident response |     12 | Database-heavy incident, broad/negative regexes, maintenance exclusions, security fan-out, two policies sharing a receiver |                    4,412 occurrences |                    44,116 occurrences |

Unlike the stress fixtures, alert names such as `HighErrorRate` and `KubePodCrashLooping` repeat. Namespace, service and team values repeat too; full label sets and 16-character hex fingerprints are unique, with distinct pods/instances. A deterministic weighted traffic cycle models hot services/tenants. Missing team/namespace/severity labels and parent fallbacks are deliberate. Times represent a fixed snapshot at 2026-09-16 09:05 UTC.

Alerts are grouped by the selected destination's inherited `group_by` labels and receiver. An alert selected by multiple `continue` routes appears in multiple groups with the **same fingerprint**, exercising deduplication. Hand-authored per-alert destination keys determine the expected results and API group membership; the unit tests independently check every unique alert against Grafana's upstream matcher before comparing count maps. Sharing a receiver does not collapse distinct policy IDs.

Performance depends on policy topology, matcher types, and traffic distribution; compare implementations across both small and large workloads.

Run just this suite and optionally export three inspectable samples:

```bash
ROUTE_MATCHING_EXPORT=1 pnpm exec vitest bench --run --config vitest.bench.config.ts \
  src/features/routes/utils/routeMatchingRealistic.bench.ts
```

This writes `benchmark-results/realistic-samples/{product-platform,managed-tenants,incident-response}.json`. Each sample contains a complete route tree, named receiver stubs, API-shaped alert groups for 96 unique alerts (including fan-out duplicates), and expected per-policy counts. The receiver stubs intentionally have no delivery integrations or secrets: these are routing examples, not deploy-ready notification delivery configurations. The output is Git-ignored and can be regenerated; normal benchmark runs do not write samples unless the environment flag is set.

The generated snapshots do not model time-interval activation, inhibition, silences, or actual notification delivery. They test the route-matching/counting semantics implemented here. Maintenance labels in the incident example exclude specific paging/warning routes; they are not a simulated Alertmanager silence.

### Large operational matrix

`buildLargePlatformWorkload(policyCount, alertCount)` adds a managed-platform topology with exactly **100, 500, or 2,000 policies**, crossed with **10,000, 30,000, or 100,000 unique alerts**. These are nine benchmark cases, not the 96-alert export samples above. Policy counts include the root and intermediate tenant policies, which receive fallback alerts too.

Tenant selectors mix exact labels, namespace-prefix regexes, and regex alternation. Each tenant has nested critical paging, database routing, and warning routing (the final tenant may have fewer children to preserve the exact policy count). Maintenance labels exclude paging; a continued central audit route creates duplicate alert occurrences across groups. The first three tenants have six times the weight for their error/database/latency cases. Other tenants remain active; every policy receives alerts. Full label sets and fingerprints are unique, while realistic routing labels and alert names repeat. This is still synthetic data, not a production capture, and models one large platform topology rather than every possible routing shape.

```bash
pnpm exec vitest bench --run --config vitest.bench.config.ts \
  src/features/routes/utils/routeMatchingLarge.bench.ts \
  --outputJson benchmark-results/large-platform.json
```

Repeat in a fresh process with `ROUTE_MATCHING_REVERSE=1` to reverse both matrix dimensions. Each case warms up for at least 300 ms / five calls and measures at least 1,000 ms / 25 calls. Fixture construction and exact expected-count checks happen outside timing; every measured call includes matcher compilation, alert deduplication, routing, and counting. Unit tests independently compare all 10,000 unique alerts at each policy size against the upstream matcher, check schemas and uniqueness, and require every policy to receive alerts. Every benchmark size additionally checks the full expected count map before timing.
