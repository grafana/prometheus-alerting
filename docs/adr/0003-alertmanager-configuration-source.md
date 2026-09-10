# 3. The editable Alertmanager configuration is the stored one

- Status: accepted
- Date: 2026-09-07

## Context

The plugin config page can edit the Alertmanager configuration as YAML. Before that, it showed the
configuration read-only, taken from `config.original` on the Alertmanager's `/api/v2/status`
response. Making that same box editable would have been the obvious change, and it would have been
wrong, because `config.original` is not the configuration anybody stored.

There are two documents, and they are not the same thing:

- **The stored configuration.** For Mimir, `GET /api/v1/alerts` returns the document the tenant owns:
  a YAML envelope with `template_files` and an `alertmanager_config` string inside it. It is byte for
  byte what was last written, comments and all.
- **The running configuration.** `/api/v2/status` reports `config.original`, which the Alertmanager
  produces by marshalling the config object it currently has loaded.

Comparing the two for the repo's own test Alertmanager, `test-data/alertmanager/alertmanager.yml`
against what `/api/v2/status` reports for it:

| In the file                        | In `config.original`                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `url: 'http://localhost:9999/...'` | `url: <secret>`                                                   |
| `routing_key: 'dummy-...'`         | `routing_key: <secret>`                                           |
| no `global:` block                 | a `global:` block with 16 keys                                    |
| `severity = critical`              | `severity="critical"`                                             |
| comments, key order, quoting       | gone                                                              |
| nothing                            | `url_file: ""`, `max_alerts: 0`, `timeout: 0s`, `continue: false` |

The redaction is the part that matters. Alertmanager's `Secret` type marshals to the literal string
`<secret>`, so every webhook URL, API key, routing key and SMTP password in the document is replaced
before it ever reaches us. Saving an edit of that document would write `<secret>` back as the actual
value of every one of those fields.

## Decision

**The editable document is the configuration the Alertmanager has stored, read and written verbatim.
`/api/v2/status` is shown alongside it, read-only, and clearly labelled as something else.**

The config page has two tabs. **Source** is the stored document, and is the only one that can be
edited. **Resolved** is `config.original`, always read-only, above a note saying that the
Alertmanager wrote it out from what it is running, that defaults are filled in and secrets are
redacted, and that it is not the document that gets saved.

Reading and writing are both raw. `readAlertmanagerConfigYaml` pulls the `alertmanager_config`
string out of the stored envelope and `writeAlertmanagerConfigYaml` puts one back, leaving
`template_files` and any key we don't recognise exactly as they were. Nothing goes through
`ParsedAlertmanagerConfigSchema` on the way in or out. This is the same pass-through
[ADR 0002](0002-namespace-yaml-requires-ruler.md) settled on for namespace YAML, for the same
reason: what you read is what the backend holds, and what you save is what you typed.

Mimir validates the configuration when it is posted, and its error is what the user sees. We check
only that the YAML parses before enabling the save button.

### Why not round-trip through the zod schemas

We already have a codec that reads the stored configuration into typed objects, so re-serialising
one of those for the editor would have been less code. It fails in two ways.

Comments and key order do not survive it, and a configuration file is a thing people comment. Saving
would silently reformat the whole document, so the diff of a one-line change would be the entire
file. That alone is enough to rule it out on a page whose purpose is hand-editing.

Worse, `ParsedAlertmanagerConfigSchema` can reject a configuration. The schemas are all
`z.looseObject`, so unknown _fields_ pass through, but a field whose _shape_ we get wrong does not,
and that is exactly the situation the YAML editor exists for. A configuration our schema cannot
parse is the one somebody most urgently needs to open and repair, and routing the editor through the
schema would be the one case where it refuses to load.

### Consequences

- Vanilla Prometheus Alertmanager has no configuration API, so it has no Source tab to edit. It gets
  the explanation from the abilities layer and the Resolved tab, which is the only view of its
  configuration it ever had.
- The stored and running documents will look different, sometimes very different, and people will
  notice. The two tabs and the note on Resolved are what make that legible rather than alarming.
- Because `template_files` is carried through untouched, notification templates edited elsewhere in
  the plugin are unaffected by a save here. The save refetches the envelope first, so a template
  added between loading the editor and saving is not lost.
- Nothing validates the configuration against our schemas before it is stored, so it is possible to
  save a configuration that the plugin's own forms cannot render. That is the price of an escape
  hatch, and Mimir still refuses anything it cannot run.

### Rejected alternatives

- **Make the existing `/api/v2/status` box editable.** The change the issue seems to ask for, and it
  destroys every secret in the configuration on first save. Not recoverable, and not obvious until
  notifications stop arriving.
- **Show only the stored configuration and drop the status view.** Loses the one thing the status
  endpoint is good for, which is telling you what is actually in effect, including the defaults you
  did not set. It would also leave vanilla Alertmanager with no configuration view at all.
- **Show both, stacked in one tall page.** Two 600px editors under one heading, with nothing but
  their captions to tell you which one you are about to copy out of. Tabs make the choice explicit.
- **Build a form for `global:` instead.** A form models the fields we know about at the time we write
  it, which is the problem being solved here, not a solution to it. It is also a lot of form.

## If we revisit this

If Mimir ever returns the stored document with secrets redacted, or normalises it on write, the
Source tab stops being trustworthy and this needs rethinking rather than patching. The check is
cheap: post a configuration with a secret in it, read it back, and see whether the secret is still
there.
