# E2E Tests

This directory contains the Playwright e2e suite for the plugin.

## Parallelism

Tests run with `fullyParallel: true` and multiple workers (6 in CI — see `playwright.config.ts`). All specs share a single backend stack (Grafana, Prometheus, Mimir) from `docker-compose`, so **isolation is the test author's responsibility, not the runner's**.

## Isolation via fixtures

The canonical way to achieve isolation is through reusable fixtures in `fixtures.ts`. Fixtures own per-test setup and teardown, so specs stay declarative and side effects don't leak across workers.

Patterns to follow:

- **Unique resource names.** Never hardcode names for resources a test creates (rule groups, contact points, etc.). Use a fixture that generates a unique identifier and cleans up in teardown — see `mimirGroup` in `fixtures.ts` for the reference pattern.
- **Page objects via fixtures.** Inject `RuleEditorPage`, `RulesListPage`, etc. through the `test` fixture rather than instantiating them inline.
- **Teardown in the fixture, not the spec.** Fixtures run cleanup even when the test fails. Don't rely on `test.afterEach` for resource cleanup that a fixture could own.

## Layout

- `fixtures.ts` — shared `test` fixture; extend this when adding new isolation primitives.
- `api/` — thin wrappers around backend APIs (e.g. Mimir) used by fixtures and specs for setup/teardown.
- `factories/` — factory functions that build domain objects (rules, etc.) with sensible defaults.
- `pages/` — page objects encapsulating selectors and interactions per screen.
- `*.spec.ts` — test files. Keep them focused on behavior; push setup into fixtures and factories.

## When adding a new test

1. If it touches a shared resource, add or reuse a fixture that namespaces it per test and cleans up.
2. Prefer factories over inline object literals for test data.
3. Prefer page object methods over raw `page.locator(...)` chains.
