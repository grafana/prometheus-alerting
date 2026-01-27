import { test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';
import { RuleDetailsPage } from './pages/RuleDetailsPage';

type AppTestFixture = {
  ruleDetailsPage: RuleDetailsPage;
};

export const test = base.extend<AppTestFixture>({
  ruleDetailsPage: async ({ page }, use) => {
    // Don't navigate - each test calls ruleDetailsPage.goto() with specific rule identifier
    const ruleDetailsPage = new RuleDetailsPage(page, pluginJson.id);
    await use(ruleDetailsPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
