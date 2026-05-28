import { Locator, Page, expect } from '@playwright/test';

/**
 * Page object for the Rules List view.
 *
 * The filter UI is an always-visible sidebar (commit b1d48ba, 2026-03-06).
 * All filters apply live on change and write to the `?search=` URL parameter
 * as space-separated `key:value` tokens (see `src/features/rules/search/rulesSearchParser.ts`).
 */
export class RulesListPage {
  readonly page: Page;
  readonly pluginId: string;

  // Top-bar free-text search
  readonly searchInput: Locator;

  // Filter sidebar (landmark + fields)
  readonly sidebar: Locator;
  readonly ruleNameInput: Locator;
  readonly namespaceInput: Locator;
  readonly groupInput: Locator;
  readonly labelsCombobox: Locator;
  readonly dataSourceCombobox: Locator;
  readonly clearFiltersButton: Locator;

  // State + type toggle buttons (visible text, scoped to sidebar)
  readonly stateAllButton: Locator;
  readonly stateFiringButton: Locator;
  readonly stateNormalButton: Locator;
  readonly statePendingButton: Locator;
  readonly typeAllButton: Locator;
  readonly typeAlertButton: Locator;
  readonly typeRecordingButton: Locator;

  // Rule list
  readonly ruleList: Locator;

  constructor(page: Page, pluginId: string) {
    this.page = page;
    this.pluginId = pluginId;

    this.searchInput = page.getByTestId('search-query-input');

    this.sidebar = page.getByRole('complementary', { name: /filter rules/i });
    this.ruleNameInput = this.sidebar.getByLabel(/rule name/i);
    this.namespaceInput = this.sidebar.getByLabel(/namespace/i);
    this.groupInput = this.sidebar.getByLabel(/^group$/i);
    this.labelsCombobox = this.sidebar.getByLabel(/^labels$/i);
    this.dataSourceCombobox = this.sidebar.getByLabel(/^data source$/i);
    this.clearFiltersButton = this.sidebar.getByRole('button', { name: /clear filters/i });

    this.stateAllButton = this.sidebar.getByRole('button', { name: /^all$/i }).first();
    this.stateFiringButton = this.sidebar.getByRole('button', { name: /^firing$/i });
    this.stateNormalButton = this.sidebar.getByRole('button', { name: /^normal$/i });
    this.statePendingButton = this.sidebar.getByRole('button', { name: /^pending$/i });
    this.typeAllButton = this.sidebar.getByRole('button', { name: /^all$/i }).nth(1);
    this.typeAlertButton = this.sidebar.getByRole('button', { name: /alert rule/i });
    this.typeRecordingButton = this.sidebar.getByRole('button', { name: /recording rule/i });

    this.ruleList = page.getByRole('list', { name: /rule/i });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/rules`);
  }

  async waitForLoad() {
    // Sidebar is rendered immediately on the rules list view; wait for it to be visible.
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });
  }

  // ----- Top-bar search (unchanged) -----

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForURL(/search=/);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.press('Enter');
  }

  // ----- Sidebar filters (live-apply) -----

  async filterByRuleName(value: string) {
    await this.ruleNameInput.fill(value);
    await this.waitForSearchToken('rule:');
  }

  async filterByNamespace(value: string) {
    await this.namespaceInput.fill(value);
    await this.waitForSearchToken('namespace:');
  }

  async filterByGroup(value: string) {
    await this.groupInput.fill(value);
    await this.waitForSearchToken('group:');
  }

  async selectState(state: 'firing' | 'normal' | 'pending') {
    const button = {
      firing: this.stateFiringButton,
      normal: this.stateNormalButton,
      pending: this.statePendingButton,
    }[state];
    await button.click();
    await this.waitForSearchToken(`state:${state}`);
  }

  async selectType(type: 'alerting' | 'recording') {
    const button = type === 'alerting' ? this.typeAlertButton : this.typeRecordingButton;
    await button.click();
    await this.waitForSearchToken(`type:${type}`);
  }

  async selectLabel(label: string) {
    await this.labelsCombobox.click();
    await this.page.getByRole('option', { name: label }).click();
    await this.waitForSearchToken('label:');
  }

  async selectDataSource(name: string) {
    await this.dataSourceCombobox.click();
    await this.page.getByRole('option', { name }).click();
    await this.waitForSearchToken('datasource:');
  }

  async clearAll() {
    await this.clearFiltersButton.click();
    await this.page.waitForURL((url) => !url.searchParams.get('search'));
  }

  // ----- URL helpers -----

  async getSearchQueryFromUrl(): Promise<string> {
    const url = new URL(this.page.url());
    return url.searchParams.get('search') || '';
  }

  /** Wait for the URL `?search=` param to contain the given token (live-applied filters). */
  async waitForSearchToken(token: string) {
    await this.page.waitForURL((url) => (url.searchParams.get('search') ?? '').includes(token));
  }

  // ----- Rule list inspection -----

  async getVisibleRuleNames(): Promise<string[]> {
    const ruleItems = this.page.getByRole('treeitem');
    await expect(ruleItems.first()).toBeVisible({ timeout: 10000 });
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
    const ruleItems = this.page.getByRole('treeitem');
    await expect(ruleItems.first()).toBeVisible({ timeout: 10000 });
    return ruleItems.count();
  }

  async hasNoRulesMessage(): Promise<boolean> {
    const emptyState = this.page.getByText(/no matching rules found/i);
    return emptyState.isVisible();
  }
}
