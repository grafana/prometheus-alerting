import { test as base } from '@grafana/plugin-e2e';
import pluginJson from '../../src/plugin.json';
import { resetMimirAlertmanagerConfig } from '../api/alertmanagerConfig';
import { InhibitRulesPage } from '../pages/InhibitRulesPage';

type AlertmanagerTestFixture = {
  inhibitRulesPage: InhibitRulesPage;
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
  resetMimirConfig: async ({}, use) => {
    await use(resetMimirAlertmanagerConfig);
    await resetMimirAlertmanagerConfig();
  },
});

export { expect } from '@grafana/plugin-e2e';
