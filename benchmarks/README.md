# Route matching benchmarks

These benchmarks measure the synchronous production path used to count unique alert instances for notification-policy routes. They include route conversion, matcher parsing, fingerprint deduplication, route traversal, and count-map construction.

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

The JSON output is ignored by Git. Record the Node version, CPU, operating system, and `@grafana/alerting` version when sharing results.

## Workloads

- **Control:** small, fast sanity check.
- **Representative:** 585 balanced routes and 9,000 unique alerts across 3,000 groups.
- **Duplicate-heavy:** the representative occurrence count with only 900 unique fingerprints.
- **Wide late match:** 499 sibling routes where every alert matches the final sibling.
- **Regex-heavy late match:** the wide traversal using regular-expression matchers.
- **Extreme regex:** the same 500-route late-match traversal with 20,000 and 30,000 unique alerts.

The extreme cases make a complete run take several minutes. Fixtures are deterministic and built before measurement. Each workload is validated once before benchmarking to ensure every unique alert reaches exactly one destination route.

Use results for comparisons on the same machine. Do not introduce absolute CI timing thresholds until repeated runs establish normal variance.
