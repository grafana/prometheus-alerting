# Rule Editor Implementation

This directory contains the rule form functionality for creating and editing data source managed rules (cloud alerting and recording rules). This implementation is ported from Grafana's unified alerting with simplifications for data source-managed rules only.

## Features

- ✅ Create new alerting rules
- ✅ Create new recording rules
- ✅ Edit existing rules
- ✅ Move rules between groups and namespaces
- ✅ Clone existing rules
- ✅ Form validation with react-hook-form
- ✅ PromQL/LogQL expression editor
- ✅ Namespace and group management
- ✅ Labels and annotations support
- ✅ Pending period and keep firing for configuration
- ✅ Data source selector filtered to Ruler API compatible sources

## Structure

```
rule-editor/
├── components/          # Form UI components
│   ├── RuleForm.tsx                  # Main form component
│   ├── RuleDefinitionSection.tsx     # Rule name, data source, expression
│   ├── CloudRulesSourcePicker.tsx    # Filtered DS picker with Ruler API
│   ├── CloudEvaluationBehavior.tsx   # Pending period & group/namespace
│   ├── GroupAndNamespaceFields.tsx   # Namespace & group selectors
│   ├── LabelsField.tsx               # Labels management
│   ├── LabelsEditorModal.tsx         # Label editor modal
│   ├── AnnotationsStep.tsx           # Annotations editor
│   └── RuleEditorSection.tsx         # Section wrapper component
├── hooks/               # Custom hooks
│   ├── useNamespacesAndGroups.ts     # Fetch namespaces/groups from Ruler API
│   ├── useProduceNewRuleGroup.ts     # Safely update rule groups
│   ├── useSaveRuleToGroup.ts         # Create, edit or move a rule
│   ├── useDeleteRuleFromGroup.ts     # Remove a rule from its group
│   └── useUnsavedChanges.ts          # Warn about unsaved changes
├── types.ts            # TypeScript types (RuleFormType, RuleFormValues)
├── formDefaults.ts     # Default form values
├── formTransform.ts    # Convert between form values and RulerRuleDTO
├── ruleTypeHelpers.ts  # Rule type detection utilities
├── ruleGroupReducer.ts # Rule group update actions
├── timeOptions.ts      # Time unit options for dropdowns
└── validation.ts       # Zod schema for form validation
```

## Usage

### Creating a New Rule

Navigate to `/rules/new?type=alerting` or `/rules/new?type=recording`

The RuleEditor page will render the RuleForm with:

- Empty form values
- Data source selector
- Expression editor based on rule type
- All configuration steps

### Editing an Existing Rule

Navigate to `/rules/{ruleIdentifier}/edit`

The `EditRuleEditor` component fetches the existing rule using `useRuleDetails` hook and converts it to form values using `rulerRuleToFormValues`, then passes it as `prefill` to `RuleForm` along with `existingRuleIdentifier` to indicate edit mode.

### Cloning a Rule

Navigate to `/rules/new?copyFrom={ruleIdentifier}`

The `CloneRuleEditor` component fetches the rule to clone using `useRuleDetails` hook, converts it to form values, generates a unique name using `generateCopiedName` from `./duplicate`, and passes the modified values as `prefill` to `RuleForm` (without `existingRuleIdentifier` to indicate new rule mode).

## API Integration

The form saves through `useSaveRuleToGroup`, which wraps the `upsertRuleGroup` mutation from
`src/api/rules/ruler.endpoints.ts`:

```typescript
upsertRuleGroup({
  dataSourceUid: string,
  namespace: string,
  payload: RulerRuleGroupDTO,
});
```

The Ruler API writes a whole group at a time and cannot move a rule between groups, so changing a
rule's data source, namespace or group is done as two writes: the rule is added to its new group
first, then removed from the old one. Doing it in that order means a failure in between leaves a
duplicate the user can see and delete, rather than losing the rule.

The mutation delegates to the data source's flavor (`src/api/rules/flavors/`), which for
Prometheus-compatible sources POSTs the rule group as YAML through
`/api/datasources/proxy/uid/{uid}/` to either `config/v1/rules/{namespace}` or Loki's
`api/prom/rules/{namespace}`. See [the flavor ADR](../../../../docs/adr/0001-rules-source-flavors.md)
for how other backends plug in.

## Form Flow

1. **Step 1:** Define rule (name, data source, expression)
2. **Step 2:** Set evaluation behavior (pending period, namespace, group)
3. **Step 3:** Add labels
4. **Step 4:** Add annotations (alerting rules only)
5. **Submit:** Save via Ruler API

## Key Differences from Grafana's Implementation

### Removed (Grafana-Managed Only)

- Grafana folder selection
- Contact points and notification routing
- Grafana evaluation behavior
- Multiple queries with expressions
- Query condition selector
- AI-powered features
- Dashboard linking
- Simplified/Advanced mode toggle for queries
- Editor settings persistence

### Kept (Data Source-Managed)

- Cloud data source selector
- Single expression editor (PromQL/LogQL)
- Pending period (for)
- Keep firing for (for alerting rules)
- Namespace and group selection
- Labels and annotations
- Form validation

### Simplified

- Expression editor uses textarea instead of rich QueryEditor integration (TODO: enhance)
- Data source picker uses Select instead of DataSourcePicker component
- No preview/testing functionality (TODO: add)

## TODO

### High Priority

1. ~~Implement fetching existing rules for edit mode~~ ✅ Done
2. ~~Implement fetching rules for clone mode~~ ✅ Done
3. Add access control checks (canCreateRules, canEditRules)
4. Integrate rich QueryEditor component from data sources
5. Add query preview/testing functionality

### Medium Priority

6. Add visualization for recording rule results
7. Improve error handling and user feedback
8. Add form autosave/draft functionality
9. Bulk operations (import/export)

### Low Priority

10. Enhanced validation rules
11. Field-level help text and examples
12. Keyboard shortcuts
13. Form analytics

## Dependencies

- `react-hook-form` (^7.65.0) - Form state management
- `@hookform/resolvers` (^5.2.2) - Validation with Zod
- `zod` (^4.1.12) - Schema validation
- `immer` (^10.1.3) - Immutable state updates
- `@grafana/ui` - UI components
- `@grafana/data` - Data types
- `@grafana/runtime` - Runtime utilities

## Type Safety

All form types are strictly typed with TypeScript:

- `RuleFormType` enum for rule types
- `RuleFormValues` interface for form state
- `RulerRuleDTO` from `@grafana/external-rules/vanilla` for API types
- Full type safety from form to API with transformation functions

## Testing

TODO: Add unit tests for:

- Form transformation functions
- Validation logic
- Component behavior
- API integration

## Performance Considerations

- Form state managed by react-hook-form for optimal performance
- Namespace/group options fetched lazily when data source selected
- Form validation runs on submit, not on every keystroke
- Memoized computed values where appropriate

## Accessibility

- All form fields have labels
- Error messages associated with fields
- Keyboard navigation supported
- Focus management on validation errors
