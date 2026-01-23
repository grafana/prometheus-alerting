# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Grafana App Plugin for managing Prometheus Alerting and Alertmanager configurations. It provides a unified UI for managing alert rules (from Prometheus, Mimir, Cortex, Loki) and Alertmanager resources (routes, receivers, templates, time intervals, inhibit rules, silences) across multiple data sources.

## Development Commands

### Build and Development

```bash
npm run dev          # Build in development mode with watch
npm run build        # Production build
npm run typecheck    # Run TypeScript type checker
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint and Prettier to fix issues
```

### Testing

```bash
npm run test         # Run tests in watch mode (requires git init)
npm run test:ci      # Run all tests once and exit
npm run e2e          # Run E2E tests with Playwright (requires npm run server first)
```

**E2E Testing Setup:**

- Framework: Playwright with `@grafana/plugin-e2e` (Grafana's plugin testing library)
- Test location: `tests/` directory (`*.spec.ts` files)
- Configuration: `playwright.config.ts`
- Test environment: Grafana runs in Docker via `docker-compose.yaml`
- Two-stage flow: Auth project authenticates first, then test project runs with saved session
- Custom fixtures in `tests/fixtures.ts` provide `appConfigPage` and `gotoPage` helpers
- CI integration: Tests run against multiple Grafana versions, reports published to GitHub Pages
- Test patterns: Use role-based selectors (`page.getByRole()`), custom page objects, and `@grafana/plugin-e2e` fixtures

### Development Server

```bash
npm run server       # Start Grafana in Docker with the plugin loaded
GRAFANA_VERSION=11.3.0 npm run server  # Start specific Grafana version
```

### Internationalization

```bash
npm run i18n-extract # Extract translation strings after adding t() or <Trans />
```

## Code Quality Standards

### TypeScript

- Never use `as` to type cast unless it can't be avoided
- Never use `any` and prefer `unknown` unless it can't be avoided
- Run `npm run typecheck` to verify types

### Linting and Formatting

- Verify code with `npm run lint` and `npm run typecheck`
- Use Prettier to format code (runs with `npm run lint:fix`)
- ESLint configured with `@grafana/eslint-config`

### Internationalization

- Use `t()` function from `@grafana/i18n` for all user-facing text
- Use `<Trans />` component for JSX content that needs translation
- Run `npm run i18n-extract` whenever new translations are added

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

## Important Conventions

- Selected Alertmanager data source UID stored in Redux (`dataSourceSlice`)
- All Alertmanager features use dynamic data source selection
- Feature pages use `AlertmanagerPage` or `PluginPage` wrappers for consistent layout
- Components use `@grafana/ui` component library
- Styles use `@emotion/css` for CSS-in-JS
