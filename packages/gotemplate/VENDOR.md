# Where this parser came from

`src/pos.ts`, `src/ast.ts`, `src/lexer.ts`, `src/parser.ts` and `src/errors.ts` started as
a copy of the parser from **[promptctl/go-template-js](https://github.com/promptctl/go-template-js)**
by Brandon Fryslie, used under the MIT licence (full text in `UPSTREAM-LICENSE`).

- Upstream commit: `5cf0a741786eacec6ef803596485a6d82d1c030f`
- Upstream version: `0.9.0`
- Taken from: `src/parser/{pos,ast,lexer,parser}.ts` and the `ParseError` half of `src/errors.ts`

We took only the lexer and parser. Upstream also has a template evaluator and a
Sprig implementation; neither is reachable from these files, and we don't want
either -- we validate templates, we never run them.

**Treat this as a fork, not a dependency.** Upstream is pre-1.0 and marks these
modules as internal with no compatibility promise, so we are not tracking it. If
something upstream looks worth having, port it across deliberately.

## What we changed

- Import specifiers dropped their `.js` extensions and `src/errors.ts` moved up
  a directory, to match how the rest of this repo imports.
- `{{else with}}` now continues an `if`/`with` chain. Upstream only handled
  `{{else if}}`, so `{{with .A}}a{{else with .B}}b{{end}}` was rejected even
  though Go accepts it.
- Identifiers accept any Unicode letter or decimal digit (`\p{L}` / `\p{Nd}`),
  matching Go's `unicode.IsLetter` / `unicode.IsDigit`. Upstream was ASCII-only,
  so `{{ .Ünïcødé }}` was rejected.
- The lexer reads whole characters rather than UTF-16 slots, so a field name
  outside the basic plane such as `{{ .𝕏 }}` works instead of reporting a stray
  surrogate half.
- Number literals no longer crash or pass silently. `{{ 0x }}` threw a raw
  `Cannot convert 0x to a BigInt`; malformed floats like `{{ 1.2.3 }}` came back
  as `NaN` and were accepted. Both now report a parse problem. Hex floats
  (`0x1p-2`) are converted properly, and integers outside Go's 64-bit range are
  reported as overflow.
- A repeated `{{ define }}` is only an error when both bodies actually do
  something, matching Go's `IsEmptyTree` rule. Upstream rejected any repeat,
  which would have flagged the edit form's own empty
  `{{ define "..." }}{{ end }}` starting content.
- A pipeline ending in `|`, as in `{{ .Alerts | }}`, is accepted. Go drops the
  empty stage and parses it, so rejecting it would block a template Mimir
  accepts.

Everything above except the `else with` gap was found by the differential test
against real Go -- see `testdata/` and `src/differential.test.ts`.

## Known differences from Go

Tracked in the snapshot at `src/__snapshots__/differential.test.ts.snap`. All of
them are cases Go rejects and we accept, which leaves a broken template savable
-- the same as today's behaviour -- rather than blocking one that works.

The larger groups are unknown function names, undefined and out-of-scope
variables, and how many variables a declaration may introduce. Adding those
checks is tracked separately; the snapshot exists so the list can only shrink.

## Regenerating the expected answers

```bash
pnpm --filter @grafana/go-template oracle:refresh
```

Needs Go installed. `testdata/expected.json` is committed, so running the tests
does not.

## Alertmanager function list

`src/funcs.ts` and `oracle/main.go` both carry `DefaultFuncs` from
prometheus/alertmanager's `template/template.go`, read from `main` on
2026-09-10. `src/funcs.test.ts` asserts the two stay in step.
