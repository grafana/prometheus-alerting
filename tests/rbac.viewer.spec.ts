import { test, expect } from './fixtures/ruler';
import { RuleBuilder, TEST_MIMIR_DATASOURCE_UID } from './factories/rules';

const testNamespace = 'e2e-test-namespace';
const testGroupName = 'e2e-test-group';
const testRuleIdentifier = RuleBuilder.createTestEditRuleIdentifier();

test.describe('Rules RBAC - viewer', () => {
  test('a viewer can view rules but not access write routes or actions', async ({
    groupDetailsPage,
    groupEditPage,
    ruleDetailsPage,
    ruleEditorPage,
    rulesListPage,
  }) => {
    await rulesListPage.goto();

    await expect(rulesListPage.sidebar).toBeVisible();
    await expect(rulesListPage.newRuleButton).toBeHidden();
    await expect(rulesListPage.editLinks).toHaveCount(0);
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
});
