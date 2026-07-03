import { Locator, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';

/**
 * Page object for the Receivers view (`/receivers`).
 *
 * Read: vanilla `test-alertmanager` (6 seeded receivers, read-only — no Create button).
 * Write: Mimir `test-mimir-alertmanager` (create/edit/delete; Create button gated by
 * `useHasConfigurationAPI()`). See `src/features/receivers/`.
 *
 * Clicking a receiver row opens the view drawer (`ReceiverDrawer`) — it does not navigate
 * to the `/receivers/:name` detail page (see `ReceiversList.tsx` `handleReceiverClick`).
 */
export class ReceiversPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly createButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyStateMessage: Locator;

  // View/edit/add drawer
  readonly drawer: Locator;
  readonly closeButton: Locator;

  // Add/edit form (rendered inside the drawer)
  readonly nameInput: Locator;
  readonly addIntegrationButton: Locator;
  readonly createSubmitButton: Locator;
  readonly updateSubmitButton: Locator;
  readonly cancelButton: Locator;

  // View-drawer footer
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  // Delete confirmation modal
  readonly confirmDeleteModal: Locator;

  constructor(page: ReceiversPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-receivers');
    // Two "Create receiver" buttons can render at once: the toolbar button and the empty-state
    // call-to-action. Target the toolbar one (first in the DOM), which is present whenever the
    // Alertmanager supports configuration, empty or not.
    this.createButton = page.getByRole('button', { name: 'Create receiver' }).first();
    this.table = this.container.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.emptyStateMessage = page.getByText(/no receivers are configured/i);

    // All three drawer modes' titles use capitalized "Receiver" ("New Receiver", "Editing
    // Receiver", "Receiver <name>"), while the delete confirmation modal below is titled
    // "Delete receiver" (lowercase "r") — this case-sensitive match distinguishes the two even
    // when both are open at once (the confirm modal renders on top of the still-mounted drawer).
    this.drawer = page.getByRole('dialog', { name: /Receiver/ });
    this.closeButton = this.drawer.getByRole('button', { name: 'Close', exact: true });

    this.nameInput = this.drawer.getByLabel('Name', { exact: true });
    this.addIntegrationButton = this.drawer.getByRole('button', { name: 'Add integration' });
    // "Create receiver" is also the drawer heading and the list-page toolbar button; scope to the
    // drawer and match the submit button by role to disambiguate.
    this.createSubmitButton = this.drawer.getByRole('button', { name: 'Create receiver', exact: true });
    this.updateSubmitButton = this.drawer.getByRole('button', { name: 'Update receiver', exact: true });
    this.cancelButton = this.drawer.getByRole('button', { name: 'Cancel', exact: true });

    this.editButton = this.drawer.getByRole('button', { name: 'Edit', exact: true });
    this.deleteButton = this.drawer.getByRole('button', { name: 'Delete', exact: true });

    this.confirmDeleteModal = page.getByRole('dialog', { name: 'Delete receiver' });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/receivers`);
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

  /** Web-first assertion on the number of receiver rows; retries until the table settles. */
  async expectReceiverCount(count: number) {
    await expect(this.rows).toHaveCount(count);
  }

  /** Locate a receiver's row by its exact name. */
  getRow(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** Text of the "Integrations" summary cell for a given receiver (e.g. "email, webhook"). */
  async getIntegrationsSummary(name: string): Promise<string> {
    return (await this.getRow(name).locator('td').nth(1).innerText()).trim();
  }

  /** Click a receiver's name to open its view drawer. */
  async openReceiverByName(name: string) {
    await this.getRow(name).getByText(name, { exact: true }).click();
    await expect(this.drawer).toBeVisible();
  }

  /**
   * The value shown for a top-level config key in the view drawer's `KeyValueList` (e.g. `to`,
   * `from`, `smarthost`). Matches the `<dt>` by exact, case-sensitive text — some configs (e.g.
   * email's `headers`) nest a nested list with differently-cased keys like `To`, which would
   * otherwise collide with the top-level `to`.
   */
  getViewFieldValue(key: string): Locator {
    return this.drawer
      .locator('dt')
      .filter({ hasText: new RegExp(`^${key}$`) })
      .locator('xpath=following-sibling::dd[1]');
  }

  async closeDrawer() {
    await this.closeButton.click();
    await expect(this.drawer).toBeHidden();
  }

  // ----- Create -----

  async openCreateDrawer() {
    await this.createButton.click();
    await expect(this.nameInput).toBeVisible();
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  /**
   * Select the integration type for the integration block at `index` (0-based, in the order
   * added). A new receiver starts with one "webhook" integration by default; `Add integration`
   * appends another "webhook" block that can then be switched to a different type.
   */
  async selectIntegrationType(index: number, label: string) {
    const combobox = this.drawer.getByRole('combobox', { name: 'Integration type' }).nth(index);
    await combobox.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  /**
   * Fill an email integration's fields. Scoped to the drawer, not a specific integration index —
   * safe as long as a form has at most one email integration (true for all planned test cases;
   * "To"/"From"/"SMTP host" don't collide with any other integration type's field labels).
   */
  async fillEmailFields({ to, from, smarthost }: { to?: string; from?: string; smarthost?: string }) {
    if (to !== undefined) {
      await this.drawer.getByLabel('To', { exact: true }).fill(to);
    }
    if (from !== undefined) {
      await this.drawer.getByLabel('From', { exact: true }).fill(from);
    }
    if (smarthost !== undefined) {
      await this.drawer.getByLabel('SMTP host', { exact: true }).fill(smarthost);
    }
  }

  /** Fill a webhook integration's URL field. Same single-integration-type scoping caveat as above. */
  async fillWebhookFields({ url }: { url: string }) {
    await this.drawer.getByLabel('URL', { exact: true }).fill(url);
  }

  async submitCreate() {
    await this.createSubmitButton.click();
  }

  // ----- Edit -----

  async startEdit() {
    await this.editButton.click();
    await expect(this.updateSubmitButton).toBeVisible();
  }

  async submitUpdate() {
    await this.updateSubmitButton.click();
  }

  // ----- Delete -----

  async removeViaDrawer() {
    await this.deleteButton.click();
    await expect(this.confirmDeleteModal).toBeVisible();
    await this.confirmDeleteModal.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(this.confirmDeleteModal).toBeHidden();
  }
}
