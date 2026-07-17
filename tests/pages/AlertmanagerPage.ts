import { Locator, Page } from '@playwright/test';
import { STORAGE_KEYS } from '../../src/constants';

/**
 * Base page object for any page wrapped in `AlertmanagerPage`
 * (`src/components/AlertmanagerPage.tsx`), which renders the "Choose Alertmanager"
 * picker in the header.
 *
 * The active Alertmanager is stored in `sessionStorage[STORAGE_KEYS.SELECTED_ALERTMANAGER_UID]`
 * and mirrored into Redux (see `src/store/store.ts` `getInitialDataSourceUID`). There is NO URL
 * param for selection, so tests either drive the picker UI (`selectAlertmanager`) or pre-seed
 * sessionStorage before navigation (`seedAlertmanager`).
 *
 * Test data source display names / UIDs (provisioning/datasources/test-datasources.yaml):
 *   "Test Alertmanager" → test-alertmanager (vanilla, read-only, seeded)
 *   Fixture-created Mimir Alertmanagers use a per-test UID and tenant header.
 */
export class AlertmanagerPage {
  readonly page: Page;
  /** The Grafana plugin ID (e.g. `grafana-prometheusalerting-app`), used to build plugin page URLs. Not a datasource UID. */
  readonly pluginId: string;

  readonly alertmanagerCombobox: Locator;

  constructor(page: Page, pluginId: string) {
    this.page = page;
    this.pluginId = pluginId;
    // The picker renders a Grafana Combobox inside an InlineField labeled "Choose Alertmanager",
    // but the label is not associated with the input for accessibility, so getByLabel() misses it.
    // Target the combobox role directly — it is the only one on Alertmanager pages.
    this.alertmanagerCombobox = page.getByRole('combobox');
  }

  /**
   * Pre-seed the selected Alertmanager in sessionStorage before the page loads.
   * Must be called before `page.goto(...)`. The plugin store reads this on init.
   */
  static async seedAlertmanager(page: Page, uid: string): Promise<void> {
    await page.addInitScript(
      ([key, value]) => {
        window.sessionStorage.setItem(key, value);
      },
      [STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, uid] as const
    );
  }

  /** Drive the picker UI to select an Alertmanager by its data source display name. */
  async selectAlertmanager(displayName: string): Promise<void> {
    await this.alertmanagerCombobox.click();
    await this.page.getByRole('option', { name: displayName }).click();
    await this.page.waitForLoadState('networkidle');
  }
}
