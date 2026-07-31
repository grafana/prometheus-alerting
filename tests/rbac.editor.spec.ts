import { test, expect } from './fixtures/ruler';
import { RuleBuilder, TEST_DATASOURCE_UID, TEST_MIMIR_DATASOURCE_UID, TEST_NAMESPACE } from './factories/rules';

const testNamespace = 'e2e-test-namespace';
const testGroupName = 'e2e-test-group';
const testRuleIdentifier = RuleBuilder.createTestEditRuleIdentifier();

const vanillaPrometheusCloudRule = RuleBuilder.createCloudRuleIdentifier(
  TEST_DATASOURCE_UID,
  TEST_NAMESPACE,
  'test-group',
  'HighErrorRate'
);

test.describe('Rules RBAC - editor', () => {
  test('an editor can access all rule write pages and actions', async ({
    groupEditPage,
    ruleEditorPage,
    rulesListPage,
  }) => {
    await rulesListPage.goto();

    await expect(rulesListPage.sidebar).toBeVisible();
    await expect(rulesListPage.newRuleButton).toBeVisible();
    await rulesListPage.switchToListView();
    await rulesListPage.openRuleActions('HighErrorRate');
    await expect(rulesListPage.silenceMenuItem).toBeVisible();

    await ruleEditorPage.gotoNew('alerting');
    await expect(ruleEditorPage.pageTitle).toHaveText('New alert rule');
    await ruleEditorPage.selectDataSource('Test Mimir');
    await expect(ruleEditorPage.saveButton).toBeEnabled();

    await ruleEditorPage.gotoEdit(testRuleIdentifier);
    await expect(ruleEditorPage.pageTitle).toHaveText(/edit.*rule/i);
    await expect(ruleEditorPage.saveButton).toBeEnabled();

    await groupEditPage.goto(TEST_MIMIR_DATASOURCE_UID, testNamespace, testGroupName);
    await expect(groupEditPage.saveButton).toBeEnabled();
    await expect(groupEditPage.deleteButton).toBeEnabled();
  });
});

test.describe('Rules RBAC editor feedback', () => {
  test('an editor sees that a handcrafted edit URL targets a datasource without Ruler support', async ({
    ruleEditorPage,
  }) => {
    await ruleEditorPage.gotoEdit(vanillaPrometheusCloudRule);

    await expect(ruleEditorPage.rulerApiNotSupportedAlert).toContainText(
      'Editing rules is only available for data sources with Ruler API.'
    );
  });

  test('an editor sees that a handcrafted clone URL targets a datasource without Ruler support', async ({
    ruleEditorPage,
  }) => {
    await ruleEditorPage.gotoClone(vanillaPrometheusCloudRule);

    await expect(ruleEditorPage.rulerApiNotSupportedAlert).toContainText(
      'Cloning rules is only available for data sources with Ruler API.'
    );
  });
});

test.describe('Rules RBAC editor mutations', () => {
  test('an editor can create a rule in a Ruler-enabled data source', async ({
    page,
    ruleEditorPage,
    mimirGroup,
    mimirRuler,
  }) => {
    const groupName = mimirGroup('rbac-editor-group');

    await ruleEditorPage.gotoNew('alerting');
    await ruleEditorPage.waitForLoad('New alert rule');
    await ruleEditorPage.fillRuleName('RBACEditorCanCreate');
    await ruleEditorPage.selectDataSource(mimirRuler.name);
    await ruleEditorPage.fillExpression('up == 0');
    await ruleEditorPage.selectNamespace(mimirRuler.namespace);
    await ruleEditorPage.createGroup(groupName);

    await ruleEditorPage.clickSave();

    await expect(page).toHaveURL(/\/rules\/cri/);
  });
});
