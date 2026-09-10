# 2. Viewing namespace YAML requires a Ruler API

- Status: accepted
- Date: 2026-09-07

## Context

The rules list can show the YAML for a whole namespace (`NamespaceYamlDrawer`, backed by
`getRuleNamespaceYaml` on `RulerBackend`). For Mimir, Cortex, and Loki this is a straight
pass-through: we `GET` the namespace from the backend's Ruler configuration API, which answers with
the YAML it has stored, and we hand that string to the editor without parsing or reformatting it.
What you read in the drawer is what the backend holds.

Vanilla Prometheus has no Ruler configuration API. Its rule files live on disk next to the
process, and the only way to ask it about rules over HTTP is `api/v1/rules`, which reports the
rules as they are currently being evaluated. So the button is hidden for it: the flavor for the
`prometheus` data source type does declare a Ruler path (Prometheus, Mimir, and Cortex all
register as the same plugin type), but the probe fails against real Prometheus, discovery reports
`rulerApiEnabled: false`, and the rules list only renders the action when that is true.

The obvious question, since the data is right there, is whether we should build the YAML ourselves
from `api/v1/rules` so Prometheus users get the feature too. We decided not to, and this records
why so nobody has to re-derive it.

## Decision

**Namespace YAML is only offered where a Ruler API can hand us the stored configuration.** We do
not synthesize it from `api/v1/rules`.

`getRuleNamespaceYaml` stays on `RulerBackend`, and the list keeps gating the action on
`rulerApiEnabled`. The name keeps saying `Yaml` rather than something format-neutral like `Raw`,
because with only one kind of implementation the promise is honest: it is the backend's own YAML,
not a rendering of it.

### Why not build it from `api/v1/rules`

It is entirely possible, and that is the trap. Every field would need converting back, and several
would not survive the round trip:

| Rule file               | `api/v1/rules`                                                                       | Round trip                            |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------- |
| `alert:`/`record:`      | `name` plus `type`                                                                   | fine                                  |
| `expr:`                 | `query`                                                                              | fine                                  |
| `for: 5m`               | `duration: 300`                                                                      | seconds, so the original unit is gone |
| `interval: 1m`          | `interval: 60`                                                                       | same                                  |
| `labels`, `annotations` | same                                                                                 | fine                                  |
| `keep_firing_for`       | `keepFiringFor`                                                                      | not in our schema, silently dropped   |
| group `limit`           | `limit`                                                                              | same                                  |
| —                       | `state`, `health`, `lastError`, `lastEvaluation`, `evaluationTime`, `alerts`, `file` | evaluation state, has to be stripped  |

The unit problem is the mild one: we would print `for: 300s` where the file said `for: 5m`. The
fields our zod schemas do not model (`PromRuleGroupDTOSchema` and `PromRuleDTOBaseSchema` in
`packages/rules/src/vanilla/api.ts`) are worse, because they disappear without any sign that
something is missing — you would be looking at a rule that appears to have no
`keep_firing_for` when it has one. Those two we could fix by extending the schemas. The rest we
cannot fix at all: comments, key order, YAML anchors, and anything a config management tool
templated into the file are simply not in the API response, and never will be.

That leaves us shipping a panel that looks like a rule file, is captioned like a rule file, and is
close enough to the real one that the differences are hard to spot — but is not it. Somebody will
copy it into version control, or diff it against the file on disk, or paste it into a support
ticket as evidence. A feature whose failure mode is "quietly wrong config" is worse than one that
is absent, because absence is obvious and prompts you to go read the actual file.

### Consequences

- Prometheus data sources show no **View YAML** action. That is the intended outcome, not a gap to
  be filled later.
- The drawer needs no wording about where its contents came from, and no "this is approximate"
  caveat, because there is only ever one answer.
- A future flavor gets this feature by having a configuration API we can read verbatim. If it can
  only reconstruct, it should leave `getRuleNamespaceYaml` out rather than approximate it.

### Rejected alternatives

- **Synthesize the YAML and label it as derived.** A banner does not help: the content is what gets
  copied out of the drawer, and the banner is not.
- **Synthesize it, but only after extending the schemas so nothing is dropped.** This fixes the
  fields we know about and leaves the unfixable ones — units, comments, ordering — plus it makes us
  responsible for tracking every field Prometheus adds to the rules API from now on. The failure
  mode when we fall behind is again silent.
- **Move the read off `RulerBackend` up to `RulesSourceFlavor` so a flavor can source it either
  way.** The right change if we ever did want per-flavor sourcing, and worth remembering as the
  shape this would take. Not worth doing for an implementation we have decided not to write.
- **Read `api/v1/status/config`.** Returns `prometheus.yml`, where `rule_files` is a list of globs.
  It tells you which files exist, not what is in them.

## If we revisit this

The thing that would change our minds is Prometheus exposing rule file contents directly. Short of
that, the honest way to give Prometheus users this feature is somewhere other than in the plugin:
they have the files.
