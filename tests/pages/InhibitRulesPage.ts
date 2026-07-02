import { Locator, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';

/**
 * Page object for the Inhibit Rules view (`/inhibit-rules`).
 *
 * Read: vanilla `test-alertmanager` (3 seeded rules, read-only — no Add button).
 * Write: Mimir `test-mimir-alertmanager` (create/edit/delete; Add button gated by
 * `useHasConfigurationAPI()`). See `src/features/inhibitRules/`.
 */
export class InhibitRulesPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyStateMessage: Locator;

  // Create/edit form (rendered inside the drawer)
  readonly sourceMatchersInput: Locator;
  readonly targetMatchersInput: Locator;
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

    // The Grafana Field label is not associated with the Input, so each textbox's accessible name
    // is its placeholder. Locate the form fields by placeholder (see InhibitRuleFormFields.tsx).
    this.sourceMatchersInput = page.getByPlaceholder('severity = critical');
    this.targetMatchersInput = page.getByPlaceholder('severity = warning');
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

  /**
   * One-shot count of the rendered rows. Prefer `expectRuleCount` in assertions — a bare
   * `count()` is not web-first and races the table's initial render under parallel load.
   */
  async getRuleCount(): Promise<number> {
    return this.rows.count();
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
    await expect(this.sourceMatchersInput).toBeVisible();
  }

  async fillForm({ source, target, equal }: { source?: string; target?: string; equal?: string }) {
    if (source !== undefined) {
      await this.sourceMatchersInput.fill(source);
    }
    if (target !== undefined) {
      await this.targetMatchersInput.fill(target);
    }
    if (equal !== undefined) {
      await this.equalLabelsInput.fill(equal);
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
