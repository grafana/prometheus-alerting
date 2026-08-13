# 1. Rules-source flavors

- Status: accepted
- Date: 2026-08-12

## Context

The plugin reads and writes alert rules for several Prometheus-compatible backends. They are not
interchangeable:

| Backend        | Plugin type  | Rules read                | Rules write                                      |
| -------------- | ------------ | ------------------------- | ------------------------------------------------ |
| Prometheus     | `prometheus` | `api/v1/rules`            | none                                             |
| Mimir / Cortex | `prometheus` | `api/v1/rules`            | Cortex ruler config API, `config/v1/rules`, YAML |
| Loki           | `loki`       | `prometheus/api/v1/rules` | Loki ruler API, `api/prom/rules`, YAML           |

Before this decision, that variation lived in four hardcoded allow-lists that disagreed with each
other, three `switch (application)` path helpers, and inline `type === 'loki'` ternaries at roughly
twenty call sites. Adding Loki touched thirty files, most of them under `src/features/rules/**`.
That cost is paid again by every new backend, and it is paid in code that has nothing to do with
the backend being added — which is the real problem, because a future backend's implementation may
well be contributed by someone outside `@grafana/alerting-frontend`.

We are willing to duplicate code between backends. We are not willing to let a new backend reach
into the parts of the app that make the existing ones work.

## Decision

Rule reads and writes go through a **flavor**: one object per data source plugin type, holding the
paths and the read/write behaviour for that backend. The contract lives in
`@grafana/external-rules/ruler` (`packages/rules/src/ruler/types.ts`):

```ts
export type RulerTransport = <T>(request: RulerRequest) => Promise<T>;

export interface RulerBackend {
  getRuleGroup(namespace: string, groupName: string): Promise<RulerRuleGroupDTO | null>;
  getAllRules(): Promise<RulerRulesConfigDTO>;
  upsertRuleGroup(namespace: string, group: RulerRuleGroupDTO): Promise<void>;
  deleteRuleGroup(namespace: string, groupName: string): Promise<void>;
}

export interface RulesSourceFlavor {
  discoverFeatures(ctx: FlavorContext): Promise<DataSourceFeatures>;
  createRulerBackend(ctx: FlavorContext): RulerBackend;
  promRulesPath: string;
  queryPath: string;
}
```

Four operations, one discovery function, two paths. Deliberately small, and deliberately shaped
around the DTOs the app already uses rather than around any one backend's API.

### Where things live

```
packages/rules/src/ruler/           @grafana/external-rules/ruler — the contract   (alerting-frontend)
    types.ts                        RulerBackend, RulerTransport, RulesSourceFlavor, DataSourceFeatures
    contract.test-helpers.ts        describeRulerBackend — the suite every flavor must pass

src/api/rules/flavors/                                                          (alerting-frontend)
    registry.ts                 plugin type -> flavor; the only file a new flavor edits
    transport.ts                RulerTransport bound to one data source UID
    vanilla.ts                  Prometheus, Mimir, Cortex, and Loki

src/api/rules/ruler.endpoints.ts  RTK Query cache over the flavor's RulerBackend
```

### Consequences that matter

**Nothing above the flavor knows which backend it is talking to.** `ruler.endpoints.ts` owns cache
keys, tags, invalidation, and zod response validation; the flavor owns transport, paths, and
payload format. Adding a flavor cannot change caching or invalidation behaviour, because it has no
access to them.

**Flavors get a transport, not a network.** `createRulerTransport(uid)` is bound to one data source
UID and percent-encodes every path segment, rejecting any segment containing `/`. A flavor cannot
address a different data source, cannot reach another Grafana API, and cannot splice a `../`
segment out of the proxy prefix. See the security contract on `buildDatasourceProxyUrl` in
`src/api/utils/proxyPath.ts`.

**The registry is the single allow-list.** `supportedRulesSourceTypes` derives from its keys, so
rules-source enumeration (`getExternalRulesSources`), the rule-editor picker filter
(`isSupportedExternalRulesSourceType`), and path selection can no longer drift apart. Deleting one
registry line removes a flavor everywhere — that is the kill switch.

**`RulesPluginType` is gone.** It only ever existed to be passed into the path helpers, and it hid
a latent bug: `buildRulerApiUrl` passed a plugin type into a parameter typed
`RulesSourceApplication`, so ruler paths were chosen by plugin type and never by the discovered
application. The two axes are now explicit — the registry is keyed by plugin type, and
`RulesSourceApplication` is presentation only (icons, query dialect).

**Flavors that need a package get one.** A flavor contributed from outside
`@grafana/alerting-frontend` lives in its own workspace package under `packages/`, not in `src/`.
`eslint.config.mjs` enforces that packages import neither `src/**` nor `@grafana/ui`,
`@grafana/runtime`, React, or Redux, so flavor code is structurally unable to reach features,
store, reducers, or RBAC. Enabling this required un-ignoring `packages/**` in the root eslint
config and adding `packages` to the root `tsconfig.json` `include`, since the per-package
tsconfigs omit their own tests.

**Every flavor runs the same behavioural suite.** `describeRulerBackend` asserts read-after-write,
sibling preservation on upsert, namespace isolation, not-found semantics, deletion of the last
group in a namespace, and `getAllRules` shape. It runs against a fake transport, so a flavor needs
no live backend to be verified. A flavor that passes it agrees with what the UI was built against;
one that does not is caught in CI rather than in production.

### Rejected alternatives

- **Keep the switches, add cases per backend.** Cheapest to write, but it puts backend-specific
  behaviour in `src/features/rules/**` and `src/types/rules.ts`, which is precisely the code the
  isolation is meant to protect.
- **A general datasource abstraction.** Rejected as premature: the differences that actually exist
  are four write operations, one discovery probe, and two paths. Anything larger would be an
  abstraction fitted to one hypothetical contributor.
- **Flavors call `getBackendSrv()` directly.** Simpler by one parameter, but it gives flavor code
  the whole Grafana API surface and makes flavors untestable without a Grafana runtime.

## Adding a flavor

1. Implement `RulesSourceFlavor`. If you are not `@grafana/alerting-frontend`, do it in a new
   `packages/<name>/` workspace package with its own `package.json` `exports` map, and add it to
   `rev-dep.config.json`.
2. Run `describeRulerBackend` against your `RulerBackend`.
3. Add one entry to `src/api/rules/flavors/registry.ts`, keyed by the data source plugin type.
4. Add a `RulesSourceApplication` value and a `DataSourceIcon` case if your backend should be
   labelled distinctly.
5. Add a fixture to `src/test/fixtures/datasources.ts` and, if the backend can run locally, a
   provisioned data source in `provisioning/datasources/test-datasources.yaml` plus a Playwright
   spec.
6. Add a path-scoped `CODEOWNERS` entry for your package, after the catch-all line so it wins, and
   keep `@grafana/alerting-frontend` as a co-owner. Do **not** add yourself to
   `/packages/rules/src/ruler/` or `/src/api/rules/flavors/` — changing the contract is a
   cross-flavor decision.

Nothing else in `src/` should need to change. If it does, the seam is in the wrong place; open an
issue rather than widening the diff.
