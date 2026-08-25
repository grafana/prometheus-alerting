import { test, expect } from './fixtures/ruler';
import pluginJson from '../src/plugin.json';

/**
 * E2E tests for the Rules List filter sidebar.
 *
 * The sidebar is always visible and all filters apply live on change. Each filter
 * writes one or more `key:value` tokens into the `?search=` URL parameter.
 */
test.describe('Rules List Filtering - E2E', () => {
  test.beforeEach(async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
  });

  test.describe('Sidebar', () => {
    test('should render the filter sidebar landmark', async ({ rulesListPage }) => {
      await expect(rulesListPage.sidebar).toBeVisible();
    });

    test('clear filters button is disabled when no filters are active', async ({ rulesListPage }) => {
      await expect(rulesListPage.clearFiltersButton).toBeDisabled();
    });
  });

  test.describe('Search Input', () => {
    test('should have search input visible', async ({ rulesListPage }) => {
      await expect(rulesListPage.searchInput).toBeVisible();
    });

    test('should update URL when searching', async ({ rulesListPage }) => {
      await rulesListPage.search('namespace:production');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('namespace:production');
    });

    test('should clear search when input is cleared', async ({ rulesListPage }) => {
      await rulesListPage.search('namespace:test');
      await rulesListPage.clearSearch();
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toBe('');
    });
  });

  test.describe('Namespace Filter', () => {
    test('should update URL when filtering by namespace', async ({ rulesListPage }) => {
      await rulesListPage.filterByNamespace('test-namespace');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('namespace:test-namespace');
    });

    test('should handle namespace with spaces (quoted)', async ({ rulesListPage }) => {
      await rulesListPage.filterByNamespace('my namespace');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('namespace:"my namespace"');
    });
  });

  test.describe('Group Filter', () => {
    test('should update URL when filtering by group', async ({ rulesListPage }) => {
      await rulesListPage.filterByGroup('test-group');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('group:test-group');
    });
  });

  test.describe('Rule Name Filter', () => {
    test('should update URL when filtering by rule name', async ({ rulesListPage }) => {
      await rulesListPage.filterByRuleName('HighErrorRate');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('rule:HighErrorRate');
    });
  });

  test.describe('State Filter', () => {
    test('should update URL when selecting firing state', async ({ rulesListPage }) => {
      await rulesListPage.selectState('firing');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('state:firing');
    });

    test('should update URL when selecting normal state', async ({ rulesListPage }) => {
      await rulesListPage.selectState('normal');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('state:normal');
    });
  });

  test.describe('Type Filter', () => {
    test('should update URL when selecting alert rule type', async ({ rulesListPage }) => {
      await rulesListPage.selectType('alerting');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('type:alerting');
    });

    test('should update URL when selecting recording rule type', async ({ rulesListPage }) => {
      await rulesListPage.selectType('recording');
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('type:recording');
    });
  });

  test.describe('Clear Filters', () => {
    test('should clear all filters when clicking clear', async ({ rulesListPage }) => {
      await rulesListPage.filterByNamespace('test');
      expect(await rulesListPage.getSearchQueryFromUrl()).toContain('namespace:test');

      await rulesListPage.clearAll();

      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toBe('');
    });

    test('clear button becomes enabled once a filter is applied', async ({ rulesListPage }) => {
      await expect(rulesListPage.clearFiltersButton).toBeDisabled();
      await rulesListPage.filterByNamespace('foo');
      await expect(rulesListPage.clearFiltersButton).toBeEnabled();
    });
  });

  test.describe('Combined Filters', () => {
    test('should support multiple filters', async ({ rulesListPage }) => {
      await rulesListPage.filterByNamespace('production');
      await rulesListPage.filterByGroup('alerts');
      await rulesListPage.filterByRuleName('Error');

      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('namespace:production');
      expect(searchQuery).toContain('group:alerts');
      expect(searchQuery).toContain('rule:Error');
    });
  });

  test.describe('URL Persistence', () => {
    test('should restore filters from URL on page load', async ({ rulesListPage, page }) => {
      await page.goto(`/a/${pluginJson.id}/rules?search=namespace:test-ns`);
      await rulesListPage.waitForLoad();

      await expect(rulesListPage.namespaceInput).toHaveValue('test-ns');
    });
  });
});

/**
 * Integration tests for actual filtering behavior.
 * Skipped — require real datasources / rules to be provisioned in the stack.
 */
test.describe('Rules List Filtering - Integration', () => {
  test.beforeEach(async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
  });

  test('should show rules from all data sources when no filter is applied', async ({ rulesListPage }) => {
    const ruleCount = await rulesListPage.getRuleCount();
    expect(ruleCount).toBeGreaterThan(0);
  });

  test('should filter rules by namespace', async ({ rulesListPage }) => {
    await rulesListPage.filterByNamespace('e2e-test-namespace');
    const ruleCount = await rulesListPage.getRuleCount();
    expect(ruleCount).toBeGreaterThan(0);
  });

  test('should show "no rules found" when filter matches nothing', async ({ rulesListPage }) => {
    await rulesListPage.filterByNamespace('nonexistent-namespace-xyz123');
    await expect(rulesListPage.page.getByText(/no matching rules found/i)).toBeVisible();
    const hasNoRules = await rulesListPage.hasNoRulesMessage();
    expect(hasNoRules).toBe(true);
  });
});

/**
 * When multiple rules in the same Ruler group share a name, the list must still resolve each
 * Prometheus-side row to its own Ruler-side rule (rather than dropping its actions) by falling
 * through labels -> query -> position-within-group disambiguation. See
 * `getMatchingRulerRule`/`createRulePositionHash` in `@grafana/external-rules/matching` and
 * `packages/rules/src/matching.test.ts` for the underlying algorithm's unit coverage; these tests
 * check its observable effect against a real Mimir backend.
 *
 * The duplicate-named rules live in the static `e2e-dup-*-group.yaml` files under
 * `test-data/mimir/rules/e2e-test-namespace/`, provisioned once at stack startup and gated on by
 * `global-setup.ts` (REQUIRED_MIMIR_GROUPS) before any test runs. These tests only read the rules
 * list, never mutate these groups, so there's no per-test isolation concern -- and no need to
 * provision-then-poll-for-readiness inside the test itself.
 */
test.describe('Duplicate Rule Name Disambiguation', () => {
  test('disambiguates same-named rules that differ by labels', async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
    await rulesListPage.filterByRuleName('DuplicateLabelRule');

    await expect(rulesListPage.getRuleRows('DuplicateLabelRule')).toHaveCount(2, { timeout: 15000 });

    const rows = await rulesListPage.getRuleRowObjects('DuplicateLabelRule');
    const editHrefs = await Promise.all(rows.map((row) => row.getEditHref()));
    // Distinct labels -> distinct rules -> distinct edit targets.
    expect(new Set(editHrefs).size).toBe(2);
  });

  test('disambiguates same-named, same-labeled rules that differ by query', async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
    await rulesListPage.filterByRuleName('DuplicateQueryRule');

    await expect(rulesListPage.getRuleRows('DuplicateQueryRule')).toHaveCount(2, { timeout: 15000 });

    const rows = await rulesListPage.getRuleRowObjects('DuplicateQueryRule');
    const editHrefs = await Promise.all(rows.map((row) => row.getEditHref()));
    // Identical labels but distinct queries -> distinct rules -> distinct edit targets.
    expect(new Set(editHrefs).size).toBe(2);
  });

  test('disambiguates fully identical duplicate rules by position within the group', async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
    await rulesListPage.filterByRuleName('DuplicatePositionRule');

    await expect(rulesListPage.getRuleRows('DuplicatePositionRule')).toHaveCount(3, { timeout: 15000 });

    // Name, labels, and query are all identical here, so matching can only succeed via position
    // within the group. Each row must still get its own Edit action -- a row silently losing its
    // actions (RuleActionsButtons falling back to read-only) is the pre-fix failure mode.
    const rows = await rulesListPage.getRuleRowObjects('DuplicatePositionRule');
    const editHrefs = await Promise.all(rows.map((row) => row.getEditHref()));
    expect(editHrefs).toHaveLength(3);
  });
});

test.describe('Data source visibility', () => {
  test('leaves out data sources that are not managed from the alerting UI', async ({
    rulesListPage,
    page,
    mimirRuler,
    unmanagedRuler,
  }) => {
    // Both datasources exist by the time the page loads, so the list is the thing under test
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();

    await rulesListPage.dataSourceCombobox.click();

    await expect(page.getByRole('option', { name: mimirRuler.name })).toBeVisible();
    // "Manage alerts via Alerting UI" is off on this one, so the plugin should not offer it --
    // nor probe it for Ruler support
    await expect(page.getByRole('option', { name: unmanagedRuler.name })).toHaveCount(0);
  });
});
