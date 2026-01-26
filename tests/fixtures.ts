import { AppConfigPage, AppPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';
import { RuleDetailsPage } from './pages/RuleDetailsPage';

type AppTestFixture = {
  appConfigPage: AppConfigPage;
  gotoPage: (path?: string) => Promise<AppPage>;
  ruleDetailsPage: RuleDetailsPage;
};

export const test = base.extend<AppTestFixture>({
  appConfigPage: async ({ gotoAppConfigPage }, use) => {
    const configPage = await gotoAppConfigPage({
      pluginId: pluginJson.id,
    });
    await use(configPage);
  },
  gotoPage: async ({ gotoAppPage }, use) => {
    await use((path) =>
      gotoAppPage({
        path,
        pluginId: pluginJson.id,
      })
    );
  },
  ruleDetailsPage: async ({ page }, use) => {
    // Don't navigate - each test calls ruleDetailsPage.goto() with specific rule identifier
    const ruleDetailsPage = new RuleDetailsPage(page, pluginJson.id);
    await use(ruleDetailsPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
