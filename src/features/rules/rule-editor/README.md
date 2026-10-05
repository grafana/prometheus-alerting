# Rule Editor

The form for creating, editing, cloning and moving data source managed rules (alerting and
recording rules on Prometheus-compatible sources and Loki). The pages that use it live in
`../pages/RuleEditor.tsx`.

## New, edit and clone

All three render `RuleForm`. What tells them apart is what the page passes in:

- **New** (`/rules/new?type=alerting|recording`): no `prefill`, no `existingRuleIdentifier`.
- **Edit** (`/rules/{ruleIdentifier}/edit`): `prefill` from `rulerRuleToFormValues` and an
  `existingRuleIdentifier` pointing at the rule's current home.
- **Clone** (`/rules/new?copyFrom={ruleIdentifier}`): `prefill` with a name made unique within the
  group by `generateCopiedName`, and deliberately **no** `existingRuleIdentifier`, so saving
  creates a new rule instead of overwriting the original.

## Saving and moving

The form saves through `useSaveRuleToGroup`. The Ruler API writes a whole group at a time and
cannot move a rule between groups, so changing a rule's data source, namespace or group is done
as two writes: the rule is added to its new group first, then removed from the old one. Keep
that order. A failure in between leaves a duplicate the user can see and delete; the other order
would lose the rule.

Group writes go through the data source's flavor (`src/api/rules/flavors/`). See
[the flavor ADR](../../../../docs/adr/0001-rules-source-flavors.md) for how backends plug in.

## TODO

### High Priority

1. Explain why the data source picker is empty when no data source supports the Ruler API; today
   it only says "No options found."
2. Show the query error in the preview panel; today a broken expression shows "No data" with the
   message hidden behind a small icon
3. Add tests for `RuleForm`, `RuleDefinitionSection`, `GroupAndNamespaceFields` and
   `useNamespacesAndGroups`

### Medium Priority

4. Add form autosave/draft functionality
5. Bulk operations (import/export)

### Low Priority

6. Enhanced validation rules
7. Field-level help text and examples
8. Keyboard shortcuts
9. Form analytics: `trackInteraction` in `src/analytics.ts` exists but the form does not call it
