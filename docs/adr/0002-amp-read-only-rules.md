# 2. Amazon Managed Service for Prometheus: read-only rules

- Status: accepted
- Date: 2026-08-13

## Context

Amazon Managed Service for Prometheus (AMP) is a Prometheus-compatible backend, added as a flavor
under the seam described in [0001-rules-source-flavors.md](0001-rules-source-flavors.md). AMP has
two properties that set it apart from the other flavors and are recorded here: its rule reads and
its rule writes live on different hosts, and it does not implement `/api/v1/status/buildinfo`.

This PR implements reads only. Writes are a follow-up, blocked on a change in
`grafana-amazonprometheus-datasource`.

## Decision

Register AMP (`grafana-amazonprometheus-datasource`) as a flavor with no `ruler` entry, so
discovery reports `rulerApiEnabled: false` without probing, and asking for a Ruler backend throws
rather than building requests against a path that cannot work. Every existing write-path gate (the
rule-editor picker, RBAC abilities, the backend factory itself) excludes AMP for free, with no
AMP-specific code in any of them.

### Grafana must have `sigv4_auth_enabled` on

Every request the plugin makes goes through `/api/datasources/proxy/uid/<uid>/…`, and Grafana only
attaches the SigV4 signing middleware to that proxy's HTTP client when **both** the data source has
`jsonData.sigV4Auth` and the server has `[auth] sigv4_auth_enabled = true`
(`pkg/services/datasources/service/datasource.go`, `if ds.JsonData … .Get("sigV4Auth") && s.cfg.SigV4AuthEnabled`).

With the server setting off, a correctly configured AMP data source still answers every proxied
request with `403 {"message":"Missing Authentication Token"}` from AWS. Queries in Explore keep
working, which makes this confusing to diagnose: the AMP data source is a backend plugin and signs
its own query requests in Go, independently of the proxy middleware.

Feature discovery deliberately rethrows 403 rather than treating it as "unsupported", so this
surfaces as an error on the data source in the rules list, not as a silently empty one.

### Reads work

`ListRules` is `GET /workspaces/<id>/api/v1/rules` on the workspace **data plane**
(`aps-workspaces.<region>.amazonaws.com`), which is the data source's own URL, so the existing
datasource proxy reaches it. It returns the standard Prometheus response shape with `file` set to
the rule groups namespace, and supports `type`, `rule_name[]`, `rule_group[]`, `file[]`,
`exclude_alerts`, `group_limit`, and `group_next_token` — a superset of the parameters
`prometheus.endpoints.ts` already sends. The AMP data source declares a proxy route for `/rules`
gated on `alert.rules.external:read`.

AMP does **not** implement `/api/v1/status/buildinfo`, so the AMP flavor sets `probeBuildInfo: false`
and never asks. Observed against a real workspace it answers 404, which `fetchBuildInfo` would have
tolerated — but not probing costs nothing and removes the dependency on that staying true.

The registry entry therefore omits `ruler` entirely: discovery reports
`{ application: 'amp', rulerApiEnabled: false }` after a single `api/v1/rules` probe, and asking for
a Ruler backend throws instead of building URLs against a path that cannot work.

### Writes are on a different host

Rule CRUD is `ListRuleGroupsNamespaces`, `DescribeRuleGroupsNamespace`,
`CreateRuleGroupsNamespace`, `PutRuleGroupsNamespace`, and `DeleteRuleGroupsNamespace` on the
**control plane** (`aps.<region>.amazonaws.com`) — a different host from the data source URL, so
the datasource proxy cannot reach it as configured. This requires a change in
[grafana/grafana-amazonprometheus-datasource](https://github.com/grafana/grafana-amazonprometheus-datasource)
(owned by `@grafana/data-sources-plugins`): add `jsonData.workspaceId` in its `ConfigEditor`, then
add proxy routes to its `plugin.json`:

```json
{
  "path": "amp/rulegroupsnamespaces",
  "url": "https://aps.{{ .JsonData.sigV4Region }}.amazonaws.com/workspaces/{{ .JsonData.workspaceId }}/rulegroupsnamespaces",
  "method": "GET",
  "reqAction": "alert.rules.external:read"
}
```

plus `POST`/`PUT`/`DELETE` variants gated on `alert.rules.external:write`. The workspace id cannot
be derived from the URL inside a route template, hence the new `jsonData` field.

Preferred over Go `CallResource` handlers because `CallResource` is authorised by
`datasources:query` alone, so alerting RBAC would not be enforced server-side. Proxy routes carry
`reqAction`, and Grafana's SigV4 middleware signs using the outbound request's `Host`, so a
route-rewritten control-plane URL signs correctly for the `aps` service with no new credential
handling.

**One assumption still to confirm:** that `DataSourceProxy` applies the SigV4 middleware to a route
with an absolute `url`, signing for the rewritten control-plane `Host` rather than the data source's
own. Note this inherits the `sigv4_auth_enabled` dependency above, so writes will be unavailable on
any Grafana where that setting is off — a deployment constraint worth stating in user-facing docs
rather than discovering in the field. If signing does not survive the rewrite, the transport reverts
to Go resource handlers and the weaker RBAC enforcement has to be handled inside them.

(The other assumption, that the data plane answers `/api/v1/status/buildinfo` with 404 rather than
403, was confirmed — and is moot now that the flavor does not probe it.)

### The data model differs

An AMP rule groups namespace is one _file_ holding many groups; Mimir's ruler is per-group. So:

| `RulerBackend`           | AMP calls                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `getAllRules()`          | `ListRuleGroupsNamespaces`, then `DescribeRuleGroupsNamespace` per namespace              |
| `getRuleGroup(ns, g)`    | `DescribeRuleGroupsNamespace(ns)`, base64-decode, parse YAML, find `g`                    |
| `upsertRuleGroup(ns, g)` | describe, replace or append `g`, serialise, base64, `Put`; 404 on describe means `Create` |
| `deleteRuleGroup(ns, g)` | describe, remove `g`, then `Put` — or `Delete` the namespace if `g` was its last group    |

Requirements the implementation has to meet:

- **Writes are asynchronous.** A namespace moves `UPDATING`/`CREATING` → `ACTIVE` |
  `UPDATE_FAILED` | `CREATION_FAILED`. `upsertRuleGroup` and `deleteRuleGroup` must poll
  `DescribeRuleGroupsNamespace` until the status settles and throw with `statusReason` on failure.
  Propagation to the Prometheus read API is already handled by `useWaitForGroupConsistency`
  (3s poll, 90s timeout) with no app changes.
- **There is no ETag.** Re-describe immediately before every `Put` and abort if sibling groups
  changed since the read. Two users editing different groups in one namespace can still clobber
  each other in a way that cannot happen on Mimir; this is mitigated, not solved.
- **`getAllRules` is an N+1.** It feeds the rule editor's namespace and group pickers
  (`useNamespacesAndGroups`). Bound its concurrency and cache it, or control-plane quotas will
  throttle a large workspace.
- **AMP validates against the plain Prometheus rule-file schema.** Reject Mimir-only fields
  (`source_tenants`, `align_evaluation_time_on_interval`) with a clear error.
- **Enforce the 721-byte limit** on the combined namespace and group name before writing.

### Testing limits

AMP cannot run in `docker-compose.yaml`, and the control-plane host is templated from
`sigV4Region`, so it cannot be pointed at a local fake. AMP therefore gets `describeRulerBackend`
plus MSW unit tests and a manual verification runbook against a real workspace — **not** a
Playwright project. It will not have e2e parity with Mimir and Loki, and that should not be papered
over.

### Out of scope

AMP notification configuration. `PutAlertManagerDefinition` is also control-plane, and
`useAvailableAlertmanagers` filters strictly on `ds.type === 'alertmanager'`, so there is no data
source for the plugin to attach to. Needs its own design.
