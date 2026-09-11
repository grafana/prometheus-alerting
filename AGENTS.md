# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Grafana App Plugin for managing Prometheus Alerting and Alertmanager configurations. It provides a unified UI for managing alert rules (from Prometheus, Mimir, Cortex, Loki) and Alertmanager resources (routes, receivers, templates, time intervals, inhibit rules, silences) across multiple data sources.

## Development Commands

### Build and Development

```bash
pnpm dev          # Build in development mode with watch
pnpm build        # Production build
pnpm typecheck    # Run TypeScript type checker
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint and Prettier to fix issues
```

### Testing

```bash
pnpm test         # Run tests in watch mode (requires git init)
pnpm test:ci      # Run all tests once and exit
pnpm e2e          # Run E2E tests with Playwright (requires pnpm server first)
```

**E2E Testing Setup:**

- Framework: Playwright with `@grafana/plugin-e2e` (Grafana's plugin testing library)
- Test location: `tests/` directory (`*.spec.ts` files)
- Configuration: `playwright.config.ts`
- Test environment: Grafana runs in Docker via `docker-compose.yaml`
- Two-stage flow: Auth project authenticates first, then test project runs with saved session
- Custom fixtures in `tests/fixtures.ts` provide `appConfigPage` and `gotoPage` helpers
- CI integration: Tests run against multiple Grafana versions, reports published to GitHub Pages

**E2E Test Best Practices:**

- **Selector priority**: Prefer role-based selectors (`page.getByRole()`) for accessibility and reliability
  - Good: `page.getByRole('button', { name: 'Save' })`
  - Fallback: `page.getByTestId('save-button')` (only when role selectors aren't feasible)
  - Last resort: `page.getByText('Save')` (fragile, breaks with i18n)
- **Waiting strategy**: Use element presence/absence checks instead of arbitrary timeouts
  - Good: `await expect(page.getByRole('alert')).toBeVisible()`
  - Good: `await expect(page.getByRole('status')).not.toBeVisible()`
  - Bad: `await page.waitForTimeout(1000)` (flaky, slow)
- **Page objects**: Encapsulate selectors and interactions in page objects (`tests/pages/`)
- **Custom fixtures**: Use `@grafana/plugin-e2e` fixtures for common Grafana interactions

**Provisioned Data Sources:**

These data sources are auto-provisioned via `provisioning/datasources/test-datasources.yaml`:

1. **Test Prometheus** (`test-prometheus`)
   - Type: `prometheus`
   - Implementation: `prometheus` (vanilla)
   - URL: `http://prometheus:9090`
   - Default data source
   - Read-only (no Ruler API support)
   - Use case: Testing read-only rule viewing

2. **Test Alertmanager** (`test-alertmanager`)
   - Type: `alertmanager`
   - Implementation: `prometheus` (vanilla)
   - URL: `http://alertmanager:9093`
   - Use case: Testing vanilla Alertmanager configuration (routes, receivers, silences, etc.)

3. **Test Mimir** (`test-mimir`)
   - Type: `prometheus`
   - Implementation: `mimir`
   - URL: `http://mimir:9009/prometheus`
   - Supports Ruler API for rule CRUD operations
   - Editable data source
   - Use case: Testing rule creation, editing, cloning, and Mimir-specific features

4. **Test Loki** (`test-loki`)
   - Type: `loki`
   - URL: `http://loki:3100`
   - Supports Ruler API for Loki rule CRUD operations
   - Editable data source
   - Use case: Testing Loki rule creation and editing

5. **Test Mimir Alertmanager** (`test-mimir-alertmanager`)
   - Type: `alertmanager`
   - Implementation: `mimir`
   - URL: `http://mimir:9009` (tenant `anonymous` via the `X-Scope-OrgID` header)
   - Editable data source, and unlike vanilla Alertmanager its configuration can be written from the UI
   - Use case: Creating and editing routes, receivers, templates, time intervals, inhibit rules and silences

**Mimir Alertmanager Test Data:**

- Mimir starts every tenant without an Alertmanager configuration, and its config API answers
  `404 alertmanager storage object not found` until something is posted. The plugin reads that 404 as
  "Mimir is still starting up" and keeps retrying, so the pages would hang on a loading skeleton.
- The `mimir-alertmanager-provisioner` container posts `test-data/mimir/alertmanager/alertmanager.yml`
  (plus any templates in `test-data/mimir/alertmanager/templates/`) to the `anonymous` tenant on startup.
- It skips the upload if the tenant already has a configuration, so restarting the container won't
  overwrite changes made from the UI.
- E2E tests don't use this data source; they create their own per-test tenant and data source
  (see the `mimirAlertmanager` fixture in `tests/fixtures/alertmanager.ts`).

**Mimir Test Data:**

- Mimir uses native file-based rule storage mounted from `test-data/mimir/rules/`
- Pre-provisioned rules in `test-data/mimir/rules/e2e-test-namespace/` are loaded by Mimir on startup
- Mimir creates internal storage in `test-data/mimir/rules/rules/anonymous/` (binary protobuf, base64-encoded names)
- The `rules/rules/` directory is git-ignored to prevent binary files from being tracked
- Tests that modify rules (edit/clone) restore them via Mimir's API in `afterEach` hooks

### Development Server

```bash
pnpm server                         # Start Grafana in Docker with the plugin loaded
GRAFANA_VERSION=11.3.0 pnpm server  # Start specific Grafana version
```

### Internationalization

```bash
pnpm i18n-extract # Extract translation strings after adding t() or <Trans />
```

## Code Quality Standards

### TypeScript

- Never use `as` to type cast unless it can't be avoided
- Never use `any` and prefer `unknown` unless it can't be avoided
- Try to use `satisfies` instead of `any`
- Run `pnpm typecheck` to verify types

### Imports

- No barrel files. Do not add an `index.ts` that only re-exports from its neighbours, and do not
  add re-exports to one that already exists. Import from the file that defines the thing:
  `features/alertmanagerConfig/components/AlertmanagerConfiguration`, not
  `features/alertmanagerConfig`. A barrel hides where code lives, makes a rename look like a
  bigger change than it is, and pulls in modules nobody asked for.
- The `index.ts` files under `packages/*/src/*/` are the workspace packages' declared entry points
  (`@grafana/external-alertmanager/mimir` and friends), so they are not covered by this.

### Linting and Formatting

- Verify code with `pnpm lint` and `pnpm typecheck`
- Use Prettier to format code (runs with `pnpm lint:fix`)
- ESLint configured with `@grafana/eslint-config`

### Internationalization

- Use `t()` function from `@grafana/i18n` for all user-facing text
- Use `<Trans />` component for JSX content that needs translation
- Run `pnpm i18n-extract` whenever new translations are added

### Layout and Styling

- Prefer `@grafana/ui` layout components for positioning and layout over custom CSS styles
- Use custom CSS styles with `@emotion/css` only when layout components cannot achieve the desired result
- Layout components provide consistent spacing, responsive behavior, and accessibility out of the box

**Available Layout Components:**

- `Stack` - Flexbox container for vertical or horizontal stacking with consistent spacing
- `Box` - General-purpose container with padding, margin, and other layout props
- `Grid` - CSS Grid layout container
- `Space` - Adds spacing between elements
- `HorizontalGroup` / `VerticalGroup` - Legacy layout components for grouping elements
- `Container` - Legacy container component
- `InlineField` - Field component for inline form layouts
- `InlineFieldRow` - Row container for inline fields
- `InlineLabel` - Label component for inline layouts
- `InlineSegmentGroup` - Group component for inline segments
- `Field` - Standard form field wrapper with label and validation
- `FieldSet` - Groups related form fields
- `Divider` - Visual separator between sections
- `ScrollContainer` - Container with custom scrollbar styling

## Custom Agents

This project has specialized agents available for specific tasks:

### grafana-ui-expert

**When to use:** Working with @grafana/ui components, layout design, accessibility, or responsive design.

**Invoke with:** `/grafana-ui-expert`

**Examples:**

- `/grafana-ui-expert Review this component and suggest layout improvements`
- `/grafana-ui-expert Which @grafana/ui component should I use for a form with inline fields?`
- `/grafana-ui-expert Is this Stack usage following best practices?`
- `/grafana-ui-expert How can I make this layout responsive?`

**Expertise:**

- Component selection and API guidance
- Layout patterns (Stack, Box, Grid)
- Accessibility best practices
- Responsive design patterns
- Performance optimization
- Theme tokens and styling conventions

## Architecture

### Monorepo Structure

This is a monorepo with workspace packages:

- `/packages/alertmanager/` - `@grafana/external-alertmanager` - Shared Alertmanager types (vanilla/mimir)
- `/packages/rules/` - `@grafana/external-rules` - Shared rules API types

### State Management

Uses Redux Toolkit with RTK Query for data fetching:

- Store configuration: `src/store/store.ts`
- Data source selection: `src/store/datasourceSlice.ts` (persisted to sessionStorage)
- API endpoints: `src/api/*.endpoints.ts`
- Custom hooks: `src/store/hooks.ts` (`useAppDispatch`, `useAppSelector`)

### Feature Organization

Features are organized by domain in `src/features/`:

- `rules/` - Alert rules management (list, details, editor)
- `routes/` - Alertmanager routing tree
- `receivers/` - Notification receivers/contact points (with integration-specific forms)
- `templates/` - Notification templates
- `silences/` - Alert silencing
- `timeIntervals/` - Notification timing schedules
- `inhibitRules/` - Alert inhibition rules

Each feature follows this structure:

```
feature/
├── pages/        # Top-level page components
├── hooks/        # Feature-specific custom hooks
├── components/   # Feature-specific UI components
├── integrations/ # (receivers only) Integration-specific forms
└── utils/        # Feature utilities
```

### API Communication Pattern

The plugin supports multiple Alertmanager implementations (vanilla Prometheus, Mimir):

- Dynamic baseQuery routes requests based on data source UID and implementation type
- URLs constructed as: `/api/datasources/proxy/uid/{uid}/...`
- All API calls include `dataSourceUID` and `implementation` parameters
- Feature hooks use `useAlertmanager()` to get current data source details

### Form Handling

- Uses `react-hook-form` for form state management
- Uses `@hookform/resolvers` with `zod` for validation schemas
- Validation schemas defined in feature `utils/` directories

### Routing

Routes defined in `src/constants.ts`:

- Base URL: `/a/grafana-prometheusalerting-app/`
- Main router in `src/components/App/App.tsx`
- Pages configured in `src/plugin.json`

## Common Development Patterns

### Adding a New Feature

1. Create feature directory: `src/features/featureName/`
2. Create hook in `hooks/useFeature.ts` that uses RTK Query
3. Create page component in `pages/FeaturePage.tsx`
4. Add route constant to `src/constants.ts`
5. Register route in `src/components/App/App.tsx`
6. Add page entry to `src/plugin.json` includes array

### Working with Alertmanager Data

```typescript
// Get current Alertmanager data source
const { uid: dataSourceUID, settings } = useAlertmanager();
const implementation = settings.jsonData?.implementation ?? 'prometheus';

// Pass to API endpoints
const { data } = useGetStatusQuery({ dataSourceUID, implementation });

// Transform response with selectFromResult
const [trigger, result] = alertmanagerApi.endpoints.getStatus.useLazyQuery({
  selectFromResult: (result) => ({
    ...result,
    receivers: result.data?.config.parsed?.receivers ?? [],
  }),
});
```

### Using Feature Hooks

Feature hooks combine data fetching, transformation, and error handling:

```typescript
const [loadReceivers, { receivers, isLoading, error }] = useReceivers();
```

## Key Files Reference

| Path                           | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `src/module.tsx`               | Plugin entry point with lazy loading       |
| `src/components/App/App.tsx`   | Main router and Redux store provider       |
| `src/store/store.ts`           | Redux store configuration                  |
| `src/api/*.endpoints.ts`       | RTK Query API endpoint definitions         |
| `src/hooks/useAlertmanager.ts` | Get current Alertmanager from Redux        |
| `src/constants.ts`             | Route definitions, storage keys, constants |
| `src/plugin.json`              | Plugin metadata and navigation pages       |
| `src/types/`                   | Core TypeScript type definitions           |
| `packages/alertmanager/`       | Shared Alertmanager types                  |
| `packages/rules/`              | Shared rules API types                     |

### Unit Testing

- Write unit tests for all pure functions (utilities, data transformations, filtering logic, etc.)
- Aim for ~100% coverage with the minimum number of tests — each test should cover a distinct code path; avoid redundant cases that exercise the same lines
- Co-locate test files next to the file under test using the `.test.ts` / `.test.tsx` suffix
- Use `fishery` factories from `src/features/<feature>/mocks/*.fakes.ts` to build test data — do not inline raw objects
- Export pure functions that need testing; prefer named exports over default for testability

## Component Usage

- Do not use deprecated components or functions from `@grafana/ui` or other packages
- Prefer current alternatives (e.g. use `Combobox` instead of `Select` for searchable dropdowns)

## Important Conventions

- Selected Alertmanager data source UID stored in Redux (`dataSourceSlice`)
- All Alertmanager features use dynamic data source selection
- Feature pages use `AlertmanagerPage` or `PluginPage` wrappers for consistent layout
- Components use `@grafana/ui` component library
- Styles use `@emotion/css` for CSS-in-JS

## Agent skills

### Issue tracker

GitHub Issues on `grafana/prometheus-alerting`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
