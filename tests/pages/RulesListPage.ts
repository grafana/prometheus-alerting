import { Locator, Page, expect } from '@playwright/test';

/**
 * Wraps a single rule-list row (`role="treeitem"`), encapsulating row-level locators/behavior
 * rather than exposing the raw `Locator` to callers. Each row can independently resolve -- or
 * fail to resolve -- a matching Ruler-side rule; see `DataSourceRuleLoader`/`RuleActionsButtons`
 * in `src/features/rules/list`.
 */
export class RuleRow {
  constructor(private readonly locator: Locator) {}

  /**
   * The row's Edit link, if the app resolved a matching Ruler-side rule for it. Absent when
   * Ruler-side matching (name/labels/query/position disambiguation) failed to resolve a unique
   * rule -- see `getMatchingRulerRule` in `@grafana/external-rules/matching`.
   */
  get editLink(): Locator {
    return this.locator.getByRole('link', { name: /^edit$/i });
  }

  /** Assert the row has a visible Edit link, then return its href. */
  async getEditHref(): Promise<string | null> {
    await expect(this.editLink).toBeVisible();
    return this.editLink.getAttribute('href');
  }
}

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
  readonly newRuleButton: Locator;
  readonly silenceMenuItem: Locator;
  readonly listViewRadio: Locator;

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
  readonly ruleRows: Locator;

  constructor(page: Page, pluginId: string) {
    this.page = page;
    this.pluginId = pluginId;

    this.searchInput = page.getByTestId('search-query-input');
    this.newRuleButton = page.getByRole('button', { name: 'New rule', exact: true });
    this.silenceMenuItem = page.getByRole('menuitem', { name: 'Silence notifications', exact: true });
    this.listViewRadio = page.getByRole('radio', { name: 'List', exact: true });

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
    this.ruleRows = page.getByRole('treeitem');
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
    await expect(this.ruleRows.first()).toBeVisible({ timeout: 10000 });
    const count = await this.ruleRows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.ruleRows.nth(i).textContent();
      if (text) {
        names.push(text);
      }
    }
    return names;
  }

  async getRuleCount(): Promise<number> {
    await expect(this.ruleRows.first()).toBeVisible({ timeout: 10000 });
    return this.ruleRows.count();
  }

  async openRuleActions(ruleName: string | RegExp) {
    const row = this.getRuleRows(ruleName).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('button', { name: 'More', exact: true }).click();
  }

  async switchToListView() {
    await this.listViewRadio.click();
  }

  async hasNoRulesMessage(): Promise<boolean> {
    const emptyState = this.page.getByText(/no matching rules found/i);
    return emptyState.isVisible();
  }

  /**
   * Rule rows whose visible text contains `text` (e.g. to scope to one rule name among
   * duplicates). Returns a `Locator`, not `RuleRow[]`, so callers can still use Playwright's
   * auto-retrying locator assertions (e.g. `expect(...).toHaveCount(...)`); resolve individual
   * rows via `getRuleRowObjects` once you're past that wait.
   */
  getRuleRows(text: string | RegExp): Locator {
    return this.ruleRows.filter({ hasText: text });
  }

  /** Resolve `getRuleRows(text)` into individual `RuleRow` objects. */
  async getRuleRowObjects(text: string | RegExp): Promise<RuleRow[]> {
    const rows = await this.getRuleRows(text).all();
    return rows.map((row) => new RuleRow(row));
  }
}
