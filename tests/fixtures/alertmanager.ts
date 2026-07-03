import { test as base } from '@grafana/plugin-e2e';
import pluginJson from '../../src/plugin.json';
import { resetMimirAlertmanagerConfig } from '../api/alertmanagerConfig';
import { InhibitRulesPage } from '../pages/InhibitRulesPage';
import { ReceiversPage } from '../pages/ReceiversPage';

/**
 * Test data source UID/display-name constants (provisioning/datasources/test-datasources.yaml),
 * shared across every Alertmanager-page spec (inhibit rules, receivers, ...).
 */
export const VANILLA_ALERTMANAGER_UID = 'test-alertmanager';
export const MIMIR_ALERTMANAGER_UID = 'test-mimir-alertmanager';
export const MIMIR_ALERTMANAGER_NAME = 'Test Mimir Alertmanager';

type AlertmanagerTestFixture = {
  inhibitRulesPage: InhibitRulesPage;
  receiversPage: ReceiversPage;
  /**
   * Reset the (single, shared) Mimir Alertmanager config to empty. Returns a callable so
   * write specs can start each test from a clean slate; the config is also reset in teardown.
   * Mimir Alertmanager write tests must run serially.
   */
  resetMimirConfig: () => Promise<void>;
};

export const test = base.extend<AlertmanagerTestFixture>({
  inhibitRulesPage: async ({ page }, use) => {
    const inhibitRulesPage = new InhibitRulesPage(page, pluginJson.id);
    await use(inhibitRulesPage);
  },
  receiversPage: async ({ page }, use) => {
    const receiversPage = new ReceiversPage(page, pluginJson.id);
    await use(receiversPage);
  },
  resetMimirConfig: async ({}, use) => {
    await use(resetMimirAlertmanagerConfig);
    await resetMimirAlertmanagerConfig();
  },
});

export { expect } from '@grafana/plugin-e2e';
