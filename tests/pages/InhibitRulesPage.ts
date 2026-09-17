import { Locator, expect } from '@playwright/test';
import type { MatcherOperator } from '@grafana/external-alertmanager/vanilla';
import { AlertmanagerPage } from './AlertmanagerPage';
import { matcherOperatorOptionNames } from './matcherOperatorOptionNames';

type MatcherInput = {
  label: string;
  operator?: MatcherOperator;
  value: string;
};

type MatcherSide = 'source' | 'target';

/**
 * Page object for the Inhibit Rules view (`/inhibit-rules`).
 *
 * Read: vanilla `test-alertmanager` (3 seeded rules, read-only — no Add button).
 * Write: a fixture-created Mimir Alertmanager (create/edit/delete; Add button gated by
 * `useHasConfigurationAPI()`). See `src/features/inhibitRules/`.
 */
export class InhibitRulesPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyStateMessage: Locator;

  // Create/edit form (rendered inside the drawer)
  readonly sourceMatchers: Locator;
  readonly targetMatchers: Locator;
  readonly equalLabelsInput: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  // View-drawer footer
  readonly editButton: Locator;
  readonly removeButton: Locator;

  // View/edit drawer
  readonly drawer: Locator;

  // Delete confirmation modal
  readonly confirmRemoveModal: Locator;

  constructor(page: InhibitRulesPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-inhibit-rules');
    // Two "Add inhibit rule" buttons can render at once: the toolbar button and the empty-state
    // call-to-action. Target the toolbar one (first in the DOM), which is present whenever the
    // Alertmanager supports configuration, empty or not.
    this.addButton = page.getByRole('button', { name: /add inhibit rule/i }).first();
    this.table = this.container.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.emptyStateMessage = page.getByText(/no inhibit rules are configured/i);

    this.sourceMatchers = page.getByRole('group', { name: 'Source Matchers' });
    this.targetMatchers = page.getByRole('group', { name: 'Target Matchers' });
    this.equalLabelsInput = page.getByPlaceholder('alertname, instance');
    this.createButton = page.getByRole('button', { name: 'Create', exact: true });
    this.updateButton = page.getByRole('button', { name: 'Update', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });

    this.drawer = page.getByRole('dialog', { name: /^inhibit rule/i });

    this.editButton = page.getByRole('button', { name: 'Edit', exact: true });
    this.removeButton = page.getByRole('button', { name: 'Remove', exact: true });

    this.confirmRemoveModal = page.getByRole('dialog', { name: /^remove inhibit rule$/i });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/inhibit-rules`);
  }

  async waitForLoad() {
    await expect(this.container).toBeVisible({ timeout: 10000 });
  }

  /** Seed the given Alertmanager UID in sessionStorage, then navigate + wait. */
  async gotoWithAlertmanager(uid: string) {
    await AlertmanagerPage.seedAlertmanager(this.page, uid);
    await this.goto();
    await this.waitForLoad();
  }

  /** Web-first assertion on the number of inhibit-rule rows; retries until the table settles. */
  async expectRuleCount(count: number) {
    await expect(this.rows).toHaveCount(count);
  }

  /** Open a rule's drawer by clicking a cell containing the given matcher text (regex-tolerant). */
  async openRuleByText(text: string | RegExp) {
    await this.table.getByText(text).first().click();
  }

  // ----- Create -----

  async openCreateDrawer() {
    await this.addButton.click();
    await expect(this.sourceMatchers).toBeVisible();
  }

  async fillForm({ source, target, equal }: { source?: MatcherInput[]; target?: MatcherInput[]; equal?: string }) {
    if (source !== undefined) {
      await this.fillMatcherGroup('source', source);
    }
    if (target !== undefined) {
      await this.fillMatcherGroup('target', target);
    }
    if (equal !== undefined) {
      await this.equalLabelsInput.fill(equal);
    }
  }

  private async fillMatcherGroup(side: MatcherSide, matchers: MatcherInput[]) {
    const group = side === 'source' ? this.sourceMatchers : this.targetMatchers;
    const addMatcherButton = group.getByRole('button', { name: `Add ${side} matcher` });
    const removeMatcherButton = group.getByRole('button', { name: `Remove ${side} matcher` });

    const labels = group.getByRole('textbox', { name: 'Label' });
    while ((await labels.count()) > matchers.length) {
      await removeMatcherButton.last().click();
    }
    while ((await labels.count()) < matchers.length) {
      await addMatcherButton.click();
    }

    for (const [index, matcher] of matchers.entries()) {
      await labels.nth(index).fill(matcher.label);
      await group.getByRole('textbox', { name: 'Value' }).nth(index).fill(matcher.value);
      const operator = group.getByRole('combobox', { name: 'Operator' }).nth(index);
      const requestedOperator = matcher.operator ?? '=';
      if ((await operator.inputValue()) !== requestedOperator) {
        await operator.fill(requestedOperator);
        await this.page
          .getByRole('option', { name: matcherOperatorOptionNames[requestedOperator], exact: true })
          .click();
      }
    }
  }

  async submitCreate() {
    await this.createButton.click();
  }

  // ----- Edit -----

  async startEdit() {
    await this.editButton.click();
    await expect(this.updateButton).toBeVisible();
  }

  async submitUpdate() {
    await this.updateButton.click();
  }

  // ----- Delete -----

  async removeViaDrawer() {
    await this.removeButton.click();
    await expect(this.confirmRemoveModal).toBeVisible();
    await this.confirmRemoveModal.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(this.confirmRemoveModal).toBeHidden();
  }
}
