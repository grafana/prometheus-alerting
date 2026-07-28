import { test, expect } from './fixtures/ruler';
import { RuleBuilder, TEST_MIMIR_DATASOURCE_UID } from './factories/rules';

const testNamespace = 'e2e-test-namespace';
const testGroupName = 'e2e-test-group';
const testRuleIdentifier = RuleBuilder.createTestEditRuleIdentifier();

test.describe('Rules RBAC', () => {
  test('a user without permissions cannot open the rules page', async ({ page, rulesListPage }, testInfo) => {
    test.skip(testInfo.project.name !== 'rbac-none', 'Only runs for the no-permissions user.');

    await rulesListPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Frules/);
  });

  test('a reader can view rules but not access write routes or actions', async ({
    groupDetailsPage,
    groupEditPage,
    ruleDetailsPage,
    ruleEditorPage,
    rulesListPage,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'rbac-reader', 'Only runs for the read-only user.');

    await rulesListPage.goto();

    await expect(rulesListPage.sidebar).toBeVisible();
    await expect(rulesListPage.newRuleButton).toBeHidden();
    await expect(rulesListPage.page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
    await rulesListPage.switchToListView();
    await rulesListPage.openRuleActions('HighErrorRate');
    await expect(rulesListPage.silenceMenuItem).toHaveCount(0);

    await ruleDetailsPage.goto(testRuleIdentifier);
    await expect(ruleDetailsPage.pageTitle).toHaveText('TestEditRule');

    await groupDetailsPage.goto(TEST_MIMIR_DATASOURCE_UID, testNamespace, testGroupName);
    await expect(groupDetailsPage.title).toHaveText(testGroupName);

    await ruleEditorPage.gotoNew('alerting');
    await expect(ruleEditorPage.permissionDeniedAlert).toBeVisible();
    await expect(ruleEditorPage.pageTitle).toHaveCount(0);

    await ruleEditorPage.gotoEdit(testRuleIdentifier);
    await expect(ruleEditorPage.permissionDeniedAlert).toBeVisible();
    await expect(ruleEditorPage.pageTitle).toHaveCount(0);

    await ruleEditorPage.gotoClone(testRuleIdentifier);
    await expect(ruleEditorPage.permissionDeniedAlert).toBeVisible();

    await groupEditPage.goto(TEST_MIMIR_DATASOURCE_UID, testNamespace, testGroupName);
    await expect(groupEditPage.permissionDeniedAlert).toBeVisible();
    await expect(groupEditPage.saveButton).toHaveCount(0);
  });

  test('an editor can access all rule write pages and actions', async ({
    groupEditPage,
    ruleEditorPage,
    rulesListPage,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'rbac-editor', 'Only runs for the editor user.');

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
