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
  readonly addTimeRangeButton: Locator;
  readonly addIntervalButton: Locator;
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
    this.addTimeRangeButton = page.getByRole('button', { name: 'Add time range' });
    this.addIntervalButton = page.getByRole('button', { name: 'Add interval', exact: true });
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

  /**
   * One interval of the form. A time interval holds a list of intervals, each rendered as its own
   * fieldset, and each holding its own list of start/end times.
   */
  interval(number = 1): Locator {
    return this.page.getByRole('group', { name: `Interval ${number}` });
  }

  startTimeInput(rangeNumber = 1, intervalNumber = 1): Locator {
    return this.interval(intervalNumber).getByRole('textbox', { name: `Start time ${rangeNumber}` });
  }

  endTimeInput(rangeNumber = 1, intervalNumber = 1): Locator {
    return this.interval(intervalNumber).getByRole('textbox', { name: `End time ${rangeNumber}` });
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
    await this.startTimeInput().fill(startTime);
    await this.endTimeInput().fill(endTime);
    await this.createSubmitButton.click();
    await expect(this.getRow(name)).toBeVisible();
  }

  async openByName(name: string) {
    await this.getRow(name).getByText(name, { exact: true }).click();
    await expect(this.drawer).toBeVisible();
  }

  async updateStartTime(startTime: string) {
    await this.editButton.click();
    await this.startTimeInput().fill(startTime);
    await this.updateSubmitButton.click();
    await expect(this.drawer).toBeHidden();
  }

  /** Adds a time range to the first interval of the interval being viewed, and saves. */
  async addTimeRange(startTime: string, endTime: string) {
    await this.editButton.click();

    const rangeNumber =
      (await this.interval()
        .getByRole('textbox', { name: /^Start time / })
        .count()) + 1;
    await this.addTimeRangeButton.first().click();
    await this.startTimeInput(rangeNumber).fill(startTime);
    await this.endTimeInput(rangeNumber).fill(endTime);

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
