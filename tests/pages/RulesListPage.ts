import { Locator, Page, expect } from '@playwright/test';

export class RulesListPage {
  readonly page: Page;
  readonly pluginId: string;

  // Search and filter elements
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly filterApplyButton: Locator;
  readonly filterClearButton: Locator;
  readonly filterCloseButton: Locator;

  // Filter fields
  readonly dataSourceSelect: Locator;
  readonly namespaceInput: Locator;
  readonly groupInput: Locator;
  readonly ruleNameInput: Locator;

  // Rule list
  readonly ruleList: Locator;

  constructor(page: Page, pluginId: string) {
    this.page = page;
    this.pluginId = pluginId;

    // Search and filter
    this.searchInput = page.getByTestId('search-query-input');
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.filterApplyButton = page.getByTestId('filter-apply-button');
    this.filterClearButton = page.getByTestId('filter-clear-button');
    this.filterCloseButton = page.getByRole('button', { name: /close/i });

    // Filter fields in the popup
    this.dataSourceSelect = page.getByRole('combobox', { name: /data source/i });
    this.namespaceInput = page.getByTestId('namespace-input');
    this.groupInput = page.getByTestId('group-input');
    this.ruleNameInput = page.getByTestId('rule-name-input');

    // Rule list
    this.ruleList = page.getByRole('list', { name: /rule/i });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/rules`);
  }

  async waitForLoad() {
    // Wait for search input to be visible
    await expect(this.searchInput).toBeVisible({ timeout: 10000 });
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    // Wait for URL to update
    await this.page.waitForURL(/search=/);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.press('Enter');
  }

  async openFilterPopup() {
    await this.filterButton.click();
    await expect(this.filterApplyButton).toBeVisible();
  }

  async closeFilterPopup() {
    await this.filterCloseButton.click();
    await expect(this.filterApplyButton).not.toBeVisible();
  }

  async applyFilters() {
    await this.filterApplyButton.click();
    // Wait for filter popup to close
    await expect(this.filterApplyButton).not.toBeVisible();
  }

  async clearFilters() {
    await this.filterClearButton.click();
  }

  async filterByNamespace(namespace: string) {
    await this.openFilterPopup();
    await this.namespaceInput.fill(namespace);
    await this.applyFilters();
  }

  async filterByGroup(groupName: string) {
    await this.openFilterPopup();
    await this.groupInput.fill(groupName);
    await this.applyFilters();
  }

  async filterByRuleName(ruleName: string) {
    await this.openFilterPopup();
    await this.ruleNameInput.fill(ruleName);
    await this.applyFilters();
  }

  async selectDataSource(dataSourceName: string) {
    await this.openFilterPopup();
    // Click on the data source combobox to open dropdown
    const combobox = this.page.locator('[class*="MultiCombobox"]').first();
    await combobox.click();
    // Select the option
    await this.page.getByRole('option', { name: dataSourceName }).click();
    await this.applyFilters();
  }

  async getVisibleRuleNames(): Promise<string[]> {
    // Wait for any loading to complete
    await this.page.waitForTimeout(500);

    const ruleItems = this.page.locator('[data-testid="rule-list-item"], [class*="ListItem"]');
    const count = await ruleItems.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await ruleItems.nth(i).textContent();
      if (text) {
        names.push(text);
      }
    }

    return names;
  }

  async getRuleCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    const ruleItems = this.page.locator('[data-testid="rule-list-item"], [class*="ListItem"]');
    return ruleItems.count();
  }

  async hasNoRulesMessage(): Promise<boolean> {
    const emptyState = this.page.getByText(/no matching rules found/i);
    return emptyState.isVisible();
  }

  async getSearchQueryFromUrl(): Promise<string> {
    const url = new URL(this.page.url());
    return url.searchParams.get('search') || '';
  }
}
