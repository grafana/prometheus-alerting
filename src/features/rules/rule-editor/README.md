# Rule Editor Implementation

This directory contains the rule form functionality for creating and editing data source managed rules (cloud alerting and recording rules). This implementation is ported from Grafana's unified alerting with simplifications for data source-managed rules only.

## Features

- ✅ Create new alerting rules
- ✅ Create new recording rules
- ✅ Edit existing rules (TODO: fetch logic)
- ✅ Clone existing rules (TODO: fetch logic)
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
│   ├── RuleForm.tsx              # Main form component
│   ├── RuleNameInput.tsx         # Rule name input field
│   ├── CloudDataSourceSelector.tsx   # Data source picker
│   ├── CloudRulesSourcePicker.tsx    # Filtered DS picker
│   ├── ExpressionEditor.tsx      # PromQL/LogQL editor (alerting)
│   ├── RecordingRuleEditor.tsx   # Expression editor (recording)
│   ├── CloudEvaluationBehavior.tsx   # Pending period & group/namespace
│   ├── GroupAndNamespaceFields.tsx   # Namespace & group selectors
│   ├── LabelsField.tsx           # Labels management
│   ├── LabelsEditorModal.tsx     # Label editor modal
│   ├── AnnotationsStep.tsx       # Annotations editor
│   └── RuleEditorSection.tsx     # Section wrapper component
├── hooks/               # Custom hooks
│   └── useNamespacesAndGroups.ts # Fetch namespaces/groups from Ruler API
├── types.ts            # TypeScript types (RuleFormType, RuleFormValues)
├── formDefaults.ts     # Default form values
├── formTransform.ts    # Convert between form values and RulerRuleDTO
├── ruleTypeHelpers.ts  # Rule type detection utilities
├── datasourceValidation.ts  # Data source type validation
├── timeOptions.ts      # Time unit options for dropdowns
└── cloneRule.ts        # Clone rule utility
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

TODO: Implement fetching the existing rule and passing as prefill to RuleForm.

### Cloning a Rule

Navigate to `/rules/new?copyFrom={ruleIdentifier}`

TODO: Implement fetching the rule to clone and passing through cloneRuleDefinition().

## API Integration

The form uses the `upsertRuleGroup` mutation from `src/api/ruler.endpoints.ts` to save rules:

```typescript
upsertRuleGroup({
  dataSourceUid: string,
  namespace: string,
  payload: RulerRuleGroupDTO,
});
```

The mutation POSTs to `/api/ruler/{uid}/api/v1/rules/{namespace}` with the rule group payload.

## Form Flow

1. **Step 1:** Define rule name
2. **Step 2:** Select data source (Prometheus/Mimir/Cortex/Loki with Ruler API)
3. **Step 3:** Write PromQL/LogQL expression
4. **Step 4:** Configure evaluation (pending period, namespace, group)
5. **Step 5:** Add labels
6. **Step 6:** Add annotations (alerting rules only)
7. **Submit:** Save via Ruler API

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

1. Implement fetching existing rules for edit mode
2. Implement fetching rules for clone mode
3. Add access control checks (canCreateRules, canEditRules)
4. Integrate rich QueryEditor component from data sources
5. Add query preview/testing functionality

### Medium Priority

6. Add visualization for recording rule results
7. Improve error handling and user feedback
8. Add form autosave/draft functionality
9. Support for moving rules between groups/namespaces
10. Bulk operations (import/export)

### Low Priority

11. Enhanced validation rules
12. Field-level help text and examples
13. Keyboard shortcuts
14. Form analytics

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
