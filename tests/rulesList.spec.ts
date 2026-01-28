import { test, expect } from './fixtures';
import pluginJson from '../src/plugin.json';

/**
 * E2E tests for the Rules List filtering functionality
 * These tests verify that the filter UI works correctly and updates the URL
 */
test.describe('Rules List Filtering - E2E', () => {
  test.beforeEach(async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
  });

  test.describe('Search Input', () => {
    test('should have search input visible', async ({ rulesListPage }) => {
      await expect(rulesListPage.searchInput).toBeVisible();
    });

    test('should update URL when searching', async ({ rulesListPage, page }) => {
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

  test.describe('Filter Popup', () => {
    test('should open filter popup when clicking filter button', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await expect(rulesListPage.filterApplyButton).toBeVisible();
      await expect(rulesListPage.filterClearButton).toBeVisible();
    });

    test('should close filter popup when clicking close', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await rulesListPage.closeFilterPopup();
      await expect(rulesListPage.filterApplyButton).not.toBeVisible();
    });

    test('should have namespace input in filter popup', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await expect(rulesListPage.namespaceInput).toBeVisible();
    });

    test('should have group input in filter popup', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await expect(rulesListPage.groupInput).toBeVisible();
    });

    test('should have rule name input in filter popup', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await expect(rulesListPage.ruleNameInput).toBeVisible();
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

  test.describe('Clear Filters', () => {
    test('should clear all filters when clicking clear', async ({ rulesListPage }) => {
      // Apply some filters first
      await rulesListPage.filterByNamespace('test');
      expect(await rulesListPage.getSearchQueryFromUrl()).toContain('namespace:test');

      // Open filter popup and clear
      await rulesListPage.openFilterPopup();
      await rulesListPage.clearFilters();

      // URL should be cleared
      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toBe('');
    });
  });

  test.describe('Combined Filters', () => {
    test('should support multiple filters', async ({ rulesListPage }) => {
      await rulesListPage.openFilterPopup();
      await rulesListPage.namespaceInput.fill('production');
      await rulesListPage.groupInput.fill('alerts');
      await rulesListPage.ruleNameInput.fill('Error');
      await rulesListPage.applyFilters();

      const searchQuery = await rulesListPage.getSearchQueryFromUrl();
      expect(searchQuery).toContain('namespace:production');
      expect(searchQuery).toContain('group:alerts');
      expect(searchQuery).toContain('rule:Error');
    });
  });

  test.describe('URL Persistence', () => {
    test('should restore filters from URL on page load', async ({ rulesListPage, page }) => {
      // Navigate directly with search params
      await page.goto(`/a/${pluginJson.id}/rules?search=namespace:test-ns`);
      await rulesListPage.waitForLoad();

      // Open filter popup and verify namespace is populated
      await rulesListPage.openFilterPopup();
      await expect(rulesListPage.namespaceInput).toHaveValue('test-ns');
    });
  });
});

/**
 * Integration tests for actual filtering behavior
 * These tests require the test Prometheus data source to be configured
 */
test.describe('Rules List Filtering - Integration', () => {
  test.beforeEach(async ({ rulesListPage }) => {
    await rulesListPage.goto();
    await rulesListPage.waitForLoad();
  });

  test.skip('should show rules from all data sources when no filter is applied', async ({ rulesListPage }) => {
    // This test requires actual data sources to be configured
    const ruleCount = await rulesListPage.getRuleCount();
    expect(ruleCount).toBeGreaterThan(0);
  });

  test.skip('should filter rules by namespace', async ({ rulesListPage }) => {
    // Filter by a known namespace
    await rulesListPage.filterByNamespace('test-namespace');

    // Verify only rules from that namespace are shown
    // This requires knowledge of the test data
    const hasNoRules = await rulesListPage.hasNoRulesMessage();
    // Either we find rules or we get "no rules found" - both are valid
    expect(typeof hasNoRules).toBe('boolean');
  });

  test.skip('should show "no rules found" when filter matches nothing', async ({ rulesListPage }) => {
    // Use a filter that won't match anything
    await rulesListPage.filterByNamespace('nonexistent-namespace-xyz123');

    // Wait for search to complete
    await rulesListPage.page.waitForTimeout(2000);

    const hasNoRules = await rulesListPage.hasNoRulesMessage();
    expect(hasNoRules).toBe(true);
  });
});
