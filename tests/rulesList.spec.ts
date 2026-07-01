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
