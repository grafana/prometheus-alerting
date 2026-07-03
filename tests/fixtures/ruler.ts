import { test as base } from '@grafana/plugin-e2e';
import pluginJson from '../../src/plugin.json';
import { deleteMimirRuleGroup } from '../api/mimir';
import { RuleDetailsPage } from '../pages/RuleDetailsPage';
import { RuleEditorPage } from '../pages/RuleEditorPage';
import { RulesListPage } from '../pages/RulesListPage';

const MIMIR_TEST_NAMESPACE = 'e2e-test-namespace';

type RulerTestFixture = {
  ruleDetailsPage: RuleDetailsPage;
  ruleEditorPage: RuleEditorPage;
  rulesListPage: RulesListPage;
  /**
   * Reserve a unique Mimir rule group name for the duration of a test.
   * Returns `${baseName}_${timestamp}` and registers the group for automatic
   * deletion in the fixture's teardown — safe under fullyParallel workers.
   */
  mimirGroup: (baseName: string) => string;
};

export const test = base.extend<RulerTestFixture>({
  ruleDetailsPage: async ({ page }, use) => {
    const ruleDetailsPage = new RuleDetailsPage(page, pluginJson.id);
    await use(ruleDetailsPage);
  },
  ruleEditorPage: async ({ page }, use) => {
    const ruleEditorPage = new RuleEditorPage(page, pluginJson.id);
    await use(ruleEditorPage);
  },
  rulesListPage: async ({ page }, use) => {
    const rulesListPage = new RulesListPage(page, pluginJson.id);
    await use(rulesListPage);
  },
  mimirGroup: async ({}, use) => {
    const created: string[] = [];
    await use((baseName) => {
      const name = `${baseName}_${Date.now()}`;
      created.push(name);
      return name;
    });
    await Promise.all(created.map((g) => deleteMimirRuleGroup(MIMIR_TEST_NAMESPACE, g)));
  },
});

export { expect } from '@grafana/plugin-e2e';
