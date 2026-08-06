import { Locator, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';

/**
 * Page object for the Silences list (`/silences`) and its create form (`/silences/new`).
 *
 * Silences are served by the Alertmanager v2 runtime API rather than the configuration API, so
 * every implementation supports mutating them — the affordances here are gated purely on the
 * `alert.instances.external:*` permissions. See `src/access-control/abilities.silences.ts`.
 *
 * Clicking any cell of a row opens the silence drawer, whose footer holds the write actions
 * (Edit / Recreate / Expire).
 */
export class SilencesPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly createButton: Locator;
  readonly emptyStateMessage: Locator;

  readonly drawer: Locator;

  // Drawer footer (write actions)
  readonly editButton: Locator;
  readonly recreateButton: Locator;
  readonly expireButton: Locator;

  // Expire confirmation modal
  readonly confirmExpireModal: Locator;

  // Create form
  readonly submitButton: Locator;
  readonly commentInput: Locator;

  constructor(page: SilencesPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-silences');
    this.table = this.container.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    // Rendered as a Grafana LinkButton, so it is an anchor rather than a button.
    this.createButton = page.getByRole('link', { name: /create silence/i });
    this.emptyStateMessage = page.getByText(/no silences are currently configured/i);

    this.drawer = page.getByRole('dialog', { name: /^silence/i });

    this.editButton = this.drawer.getByRole('button', { name: 'Edit', exact: true });
    this.recreateButton = this.drawer.getByRole('button', { name: 'Recreate', exact: true });
    this.expireButton = this.drawer.getByRole('button', { name: 'Expire', exact: true });

    this.confirmExpireModal = page.getByRole('dialog', { name: /^expire silence$/i });

    this.submitButton = page.getByRole('button', { name: /create silence/i });
    this.commentInput = page.getByPlaceholder('e.g., Planned maintenance window');
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/silences`);
  }

  async gotoCreate() {
    await this.page.goto(`/a/${this.pluginId}/silences/new`);
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

  /** Seed the given Alertmanager UID in sessionStorage, then navigate straight to the create form. */
  async gotoCreateWithAlertmanager(uid: string) {
    await AlertmanagerPage.seedAlertmanager(this.page, uid);
    await this.gotoCreate();
  }

  /** Open a silence's drawer by clicking a cell containing the given text (regex-tolerant). */
  async openSilenceByText(text: string | RegExp) {
    await this.table.getByText(text).first().click();
    await expect(this.drawer).toBeVisible();
  }
}
