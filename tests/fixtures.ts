import { test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';
import { RuleDetailsPage } from './pages/RuleDetailsPage';
import { RuleEditorPage } from './pages/RuleEditorPage';
import { RulesListPage } from './pages/RulesListPage';

type AppTestFixture = {
  ruleDetailsPage: RuleDetailsPage;
  ruleEditorPage: RuleEditorPage;
  rulesListPage: RulesListPage;
};

export const test = base.extend<AppTestFixture>({
  ruleDetailsPage: async ({ page }, use) => {
    // Don't navigate - each test calls ruleDetailsPage.goto() with specific rule identifier
    const ruleDetailsPage = new RuleDetailsPage(page, pluginJson.id);
    await use(ruleDetailsPage);
  },
  ruleEditorPage: async ({ page }, use) => {
    // Don't navigate - each test calls ruleEditorPage.goto*() methods
    const ruleEditorPage = new RuleEditorPage(page, pluginJson.id);
    await use(ruleEditorPage);
  },
  rulesListPage: async ({ page }, use) => {
    const rulesListPage = new RulesListPage(page, pluginJson.id);
    await use(rulesListPage);
  },
});

export { expect } from '@grafana/plugin-e2e';
