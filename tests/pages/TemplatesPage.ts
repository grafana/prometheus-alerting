import { Locator, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';

/**
 * Page object for the Templates view (`/templates`).
 *
 * Vanilla `test-alertmanager` has no seeded templates and no configuration API — use it only for
 * the empty-state / hidden-create-button checks. Write: Mimir `test-mimir-alertmanager`
 * (create/edit/delete; Create button gated by `useHasConfigurationAPI()`).
 * See `src/features/templates/`.
 *
 * Clicking a template row opens the view drawer (`TemplateDrawer`) — no separate detail route.
 */
export class TemplatesPage extends AlertmanagerPage {
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
  readonly contentEditor: Locator;
  readonly createSubmitButton: Locator;
  readonly updateSubmitButton: Locator;
  readonly cancelButton: Locator;

  // View-drawer footer
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  // Delete confirmation modal
  readonly confirmDeleteModal: Locator;

  constructor(page: TemplatesPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-templates');
    // Two "Create template" buttons can render at once: the toolbar button and the empty-state
    // call-to-action. Target the toolbar one (first in the DOM), which is present whenever the
    // Alertmanager supports configuration, empty or not.
    this.createButton = page.getByRole('button', { name: 'Create template' }).first();
    this.table = this.container.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.emptyStateMessage = page.getByText(/no templates are configured/i);

    // All three drawer modes' titles use capitalized "Template" ("New Template", "Editing
    // Template", "Template <name>"), while the delete confirmation modal is titled "Delete
    // template" (lowercase "t") — this case-sensitive match distinguishes the two even when both
    // are open at once (the confirm modal renders on top of the still-mounted drawer).
    this.drawer = page.getByRole('dialog', { name: /Template/ });
    this.closeButton = this.drawer.getByRole('button', { name: 'Close', exact: true });

    this.nameInput = this.drawer.getByLabel('Name', { exact: true });
    // Monaco's hidden textarea has a built-in accessible name of "Editor content" (same pattern as
    // RuleEditorPage.ts), independent of any Grafana wiring. Shared by both edit-mode (writable)
    // and view-mode (readOnly) instances, but the two are mutually exclusive within one drawer.
    this.contentEditor = this.drawer.getByRole('textbox', { name: /Editor content/i });
    // "Create template" is also the drawer heading and the list-page toolbar button; scope to the
    // drawer and match the submit button by role to disambiguate.
    this.createSubmitButton = this.drawer.getByRole('button', { name: 'Create template', exact: true });
    this.updateSubmitButton = this.drawer.getByRole('button', { name: 'Update template', exact: true });
    this.cancelButton = this.drawer.getByRole('button', { name: 'Cancel', exact: true });

    this.editButton = this.drawer.getByRole('button', { name: 'Edit', exact: true });
    this.deleteButton = this.drawer.getByRole('button', { name: 'Delete', exact: true });

    this.confirmDeleteModal = page.getByRole('dialog', { name: 'Delete template' });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/templates`);
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

  /** Web-first assertion on the number of template rows; retries until the table settles. */
  async expectTemplateCount(count: number) {
    await expect(this.rows).toHaveCount(count);
  }

  /** Locate a template's row by its exact name. */
  getRow(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** Click a template's name to open its view drawer. */
  async openTemplateByName(name: string) {
    await this.getRow(name).getByText(name, { exact: true }).click();
    await expect(this.drawer).toBeVisible();
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
   * Replace the content editor's value. Monaco only commits its value on blur/save (`onBlur` and
   * `onSave` in `TemplateEditForm`), so select-all + fill + blur is required for the new value to
   * register with the form (same pattern as `RuleEditorPage.fillExpression`).
   */
  async fillContent(content: string) {
    await this.contentEditor.click();
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.contentEditor.fill(content);
    await this.contentEditor.blur();
  }

  /** Current value of the content editor (view or edit mode) via its underlying textarea. */
  async getContent(): Promise<string> {
    return this.contentEditor.inputValue();
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
