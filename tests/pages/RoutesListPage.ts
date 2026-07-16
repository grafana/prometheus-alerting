import { Locator, expect } from '@playwright/test';
import { AlertmanagerPage } from './AlertmanagerPage';
import { MatcherOperator } from '../../src/features/routes/types';

/**
 * Page object for the Routes / notification tree view (`/routes`).
 *
 * Read: vanilla `test-alertmanager` (root + 5 seeded child routes, read-only — no Add button).
 * Write: Mimir `test-mimir-alertmanager` (add/edit/delete; gated by `useHasConfigurationAPI()`
 * via `canEdit`). See `src/features/routes/`.
 *
 * Clicking a route opens `RouteDrawer`; clicking its receiver link opens `ReceiverDrawer`, which
 * *replaces* it (the route drawer unmounts, not just visually hides) — "Back to route" is the
 * only way back. Both are Grafana `Drawer`s (`role="dialog"`); distinguish them by title
 * ("Route ..." vs "Receiver ...") rather than by position/stacking.
 */
export class RoutesListPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly emptyStateMessage: Locator;
  readonly rootRoute: Locator;
  readonly childRoutes: Locator;
  readonly newChildRouteButton: Locator;

  readonly routeDrawer: Locator;
  readonly receiverDrawer: Locator;
  readonly routeDrawerCloseButton: Locator;

  // View-drawer footer
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  // Add/edit form (rendered inside routeDrawer)
  readonly addMatcherButton: Locator;
  readonly receiverSelector: Locator;
  readonly overrideGroupingToggle: Locator;
  readonly overrideTimingsToggle: Locator;
  readonly groupByInput: Locator;
  readonly groupWaitInput: Locator;
  readonly groupIntervalInput: Locator;
  readonly repeatIntervalInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Delete confirmation modal (shared title/body for both the card-menu and drawer-footer flows)
  readonly confirmDeleteModal: Locator;

  constructor(page: RoutesListPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-routes');
    this.emptyStateMessage = page.getByText(/no routing configuration is available/i);
    this.rootRoute = page.getByTestId('am-root-route-container');
    this.childRoutes = page.getByTestId('am-route-container');
    this.newChildRouteButton = page.getByRole('button', { name: /new child route/i });

    this.routeDrawer = page.getByRole('dialog', { name: /^(New |Editing )?Route\b/ });
    this.receiverDrawer = page.getByRole('dialog', { name: /^(Back to route )?(New |Editing )?Receiver\b/ });
    this.routeDrawerCloseButton = this.routeDrawer.getByRole('button', { name: 'Close', exact: true });

    this.editButton = this.routeDrawer.getByRole('button', { name: 'Edit', exact: true });
    this.deleteButton = this.routeDrawer.getByRole('button', { name: 'Delete', exact: true });

    this.addMatcherButton = this.routeDrawer.getByRole('button', { name: /add matcher/i });
    // Matches both the placeholder-only accessible name (no Field label association, e.g.
    // Grafana 13.0.x) and the label+description form (Field label wired via aria-labelledby,
    // e.g. Grafana 13.1.0+) — the two @grafana/ui behaviors observed across the e2e matrix.
    this.receiverSelector = this.routeDrawer.getByRole('combobox', { name: /receiver/i });
    this.overrideGroupingToggle = this.routeDrawer.locator('#override-grouping-toggle');
    this.overrideTimingsToggle = this.routeDrawer.locator('#override-timings-toggle');
    this.groupByInput = this.routeDrawer.getByRole('combobox', { name: 'Group by' });
    this.groupWaitInput = this.routeDrawer.getByPlaceholder('30s');
    this.groupIntervalInput = this.routeDrawer.getByPlaceholder('5m');
    this.repeatIntervalInput = this.routeDrawer.getByPlaceholder('4h');
    this.saveButton = this.routeDrawer.getByRole('button', { name: 'Save', exact: true });
    this.cancelButton = this.routeDrawer.getByRole('button', { name: 'Cancel', exact: true });

    this.confirmDeleteModal = page.getByRole('dialog', { name: 'Delete Route' });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/routes`);
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

  /** Locate a (non-root) route card by matcher/receiver text it contains (regex-tolerant). */
  getChildRoute(text: string | RegExp): Locator {
    return this.childRoutes.filter({ hasText: text });
  }

  /** Open a route's drawer by clicking its card. */
  async openRoute(routeLocator: Locator) {
    await routeLocator.click();
    await expect(this.routeDrawer).toBeVisible();
  }

  async openRootRoute() {
    await this.openRoute(this.rootRoute);
  }

  async openChildRoute(text: string | RegExp) {
    await this.openRoute(this.getChildRoute(text));
  }

  async closeDrawer() {
    await this.routeDrawerCloseButton.click();
    await expect(this.routeDrawer).toBeHidden();
  }

  /** Click the receiver link in the route drawer, opening the ReceiverDrawer (see class doc). */
  async openReceiverLink(receiverName: string) {
    await this.routeDrawer.getByRole('link', { name: receiverName, exact: true }).click();
    await expect(this.receiverDrawer).toBeVisible();
  }

  /** Click the ReceiverDrawer's "Back to route" button, returning to the route drawer. */
  async goBackToRoute() {
    await this.receiverDrawer.getByRole('button', { name: 'Back to route' }).click();
    await expect(this.routeDrawer).toBeVisible();
  }

  // ----- Add -----

  async startAddChildRouteFromRoot() {
    await this.newChildRouteButton.click();
    await expect(this.routeDrawer).toBeVisible();
  }

  /**
   * Open a non-root route's "Add" dropdown menu and pick an action. The menu renders in a
   * floating overlay (not nested under the card), so its items are queried at the page level.
   */
  async openAddMenu(
    routeLocator: Locator,
    action: 'New sibling above' | 'New sibling below' | 'New child route' | 'Delete route'
  ) {
    await routeLocator.getByRole('button', { name: 'Add', exact: true }).click();
    await this.page.getByRole('menuitem', { name: action, exact: true }).click();
  }

  // ----- Matchers (add/edit form) -----

  matcherLabelInput(index: number): Locator {
    return this.routeDrawer.getByPlaceholder('label').nth(index);
  }

  matcherValueInput(index: number): Locator {
    return this.routeDrawer.getByPlaceholder('value').nth(index);
  }

  /** Operator Combobox for matcher row `index` — matcher rows render first in the form, so a
   * positional index reliably targets the right row. */
  matcherOperatorCombobox(index: number): Locator {
    return this.routeDrawer.getByRole('combobox').nth(index);
  }

  /** Append a new matcher row and fill it in one call. */
  async addMatcher(params: { label: string; operator?: MatcherOperator; value: string }) {
    const index = await this.routeDrawer.getByPlaceholder('label').count();
    await this.addMatcherButton.click();
    await this.matcherLabelInput(index).fill(params.label);
    if (params.operator !== undefined) {
      await this.matcherOperatorCombobox(index).click();
      await this.page.getByRole('option', { name: params.operator, exact: true }).click();
    }
    await this.matcherValueInput(index).fill(params.value);
  }

  async selectReceiver(name: string) {
    await this.receiverSelector.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async submitSave() {
    await this.saveButton.click();
  }

  // ----- Edit -----

  async startEdit() {
    await this.editButton.click();
    await expect(this.saveButton).toBeVisible();
  }

  // ----- Delete -----

  /** Delete a route via its card's "Add" menu (root has no such menu — it can't be deleted). */
  async deleteViaCardMenu(routeLocator: Locator) {
    await this.openAddMenu(routeLocator, 'Delete route');
    await this.confirmDelete();
  }

  /** Delete the currently open route via the drawer footer's Delete button + confirmation. */
  async deleteViaDrawer() {
    await this.deleteButton.click();
    await this.confirmDelete();
  }

  private async confirmDelete() {
    await expect(this.confirmDeleteModal).toBeVisible();
    await this.confirmDeleteModal.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(this.confirmDeleteModal).toBeHidden();
  }
}
