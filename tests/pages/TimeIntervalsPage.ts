import { Locator, expect } from '@playwright/test';

import { AlertmanagerPage } from './AlertmanagerPage';

/** Page object for the time intervals list, create form, and view/edit drawer. */
export class TimeIntervalsPage extends AlertmanagerPage {
  readonly container: Locator;
  readonly createLink: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly drawer: Locator;
  readonly editButton: Locator;
  readonly removeButton: Locator;
  readonly nameInput: Locator;
  readonly startTimeInput: Locator;
  readonly endTimeInput: Locator;
  readonly createSubmitButton: Locator;
  readonly updateSubmitButton: Locator;
  readonly confirmRemoveModal: Locator;
  readonly permissionDeniedAlert: Locator;

  constructor(page: TimeIntervalsPage['page'], pluginId: string) {
    super(page, pluginId);

    this.container = page.getByTestId('data-testid prom-time-intervals');
    this.createLink = page.getByRole('link', { name: 'Create time interval', exact: true });
    this.table = this.container.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.drawer = page.getByRole('dialog').first();
    this.editButton = this.drawer.getByRole('button', { name: 'Edit', exact: true });
    this.removeButton = this.drawer.getByRole('button', { name: 'Remove', exact: true });
    this.nameInput = page.getByRole('textbox', { name: /^Name/ });
    this.startTimeInput = page.getByRole('textbox', { name: /^Start Time/ });
    this.endTimeInput = page.getByRole('textbox', { name: /^End Time/ });
    this.createSubmitButton = page.getByRole('button', { name: 'Create Time Interval', exact: true });
    this.updateSubmitButton = this.drawer.getByRole('button', { name: 'Update', exact: true });
    this.confirmRemoveModal = page.getByRole('dialog', { name: 'Remove Time Interval' });
    this.permissionDeniedAlert = page.getByRole('alert').filter({ hasText: 'Permission denied' });
  }

  async goto() {
    await this.page.goto(`/a/${this.pluginId}/time-intervals`);
  }

  async gotoCreate() {
    await this.page.goto(`/a/${this.pluginId}/time-intervals/new`);
  }

  async waitForLoad() {
    await expect(this.container).toBeVisible({ timeout: 10000 });
  }

  async gotoWithAlertmanager(uid: string) {
    await AlertmanagerPage.seedAlertmanager(this.page, uid);
    await this.goto();
    await this.waitForLoad();
  }

  getRow(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async openCreateForm() {
    await this.createLink.click();
    await expect(this.createSubmitButton).toBeVisible();
  }

  async create(name: string, startTime: string, endTime: string) {
    await this.nameInput.fill(name);
    await this.startTimeInput.fill(startTime);
    await this.endTimeInput.fill(endTime);
    await this.createSubmitButton.click();
    await expect(this.getRow(name)).toBeVisible();
  }

  async openByName(name: string) {
    await this.getRow(name).getByText(name, { exact: true }).click();
    await expect(this.drawer).toBeVisible();
  }

  async updateStartTime(startTime: string) {
    await this.editButton.click();
    await this.startTimeInput.fill(startTime);
    await this.updateSubmitButton.click();
    await expect(this.drawer).toBeHidden();
  }

  async remove() {
    await this.removeButton.click();
    await expect(this.confirmRemoveModal).toBeVisible();
    await this.confirmRemoveModal.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(this.confirmRemoveModal).toBeHidden();
  }
}
