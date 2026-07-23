import { getRuleName } from '@grafana/external-rules/utils';
import { expect, test } from './fixtures/ruler';
import { getMimirRuleGroup } from './api/mimir';
import { TEST_DATASOURCE_UID, TEST_NAMESPACE } from './factories/rules';

test.describe('Group Edit', () => {
  test('shows a read-only guard for Prometheus groups', async ({ groupEditPage, page }) => {
    await groupEditPage.goto(TEST_DATASOURCE_UID, TEST_NAMESPACE, 'test-group');
    await expect(page.getByText('This group cannot be edited')).toBeVisible();
    await expect(groupEditPage.saveButton).toHaveCount(0);
  });

  test('shows and validates the editable group form', async ({ groupEditPage, mimirRuler, page }) => {
    await groupEditPage.goto(mimirRuler.uid, mimirRuler.namespace, mimirRuler.groupName);
    await groupEditPage.waitForLoad();
    await expect(groupEditPage.namespaceInput).toHaveValue(mimirRuler.namespace);
    await expect(groupEditPage.nameInput).toHaveValue(mimirRuler.groupName);
    await expect(groupEditPage.intervalInput).toHaveValue('1m');
    await expect(groupEditPage.ruleItems).toHaveCount(3);
    await groupEditPage.namespaceInput.fill('');
    await groupEditPage.nameInput.fill('');
    await groupEditPage.saveButton.click();
    await expect(page.getByText('Namespace is required')).toBeVisible();
    await expect(page.getByText('Group name is required')).toBeVisible();
  });

  test('updates the evaluation interval', async ({ groupEditPage, mimirRuler }) => {
    await groupEditPage.goto(mimirRuler.uid, mimirRuler.namespace, mimirRuler.groupName);
    await groupEditPage.waitForLoad();
    await groupEditPage.pageContent.getByRole('button', { name: '30s', exact: true }).click();
    await groupEditPage.saveButton.click();
    await expect
      .poll(
        async () => (await getMimirRuleGroup(mimirRuler.tenantId, mimirRuler.namespace, mimirRuler.groupName))?.interval
      )
      .toBe('30s');
  });

  test('reorders rules and persists the new order', async ({ groupEditPage, mimirRuler }) => {
    await groupEditPage.goto(mimirRuler.uid, mimirRuler.namespace, mimirRuler.groupName);
    await groupEditPage.waitForLoad();

    await groupEditPage.reorder('TestEditRule', 'test:recording:rule');
    await expect(groupEditPage.ruleItems).toHaveText([/TestCloneRule/, /test:recording:rule/, /TestEditRule/]);

    await groupEditPage.saveButton.click();
    await expect
      .poll(async () => {
        const persistedGroup = await getMimirRuleGroup(
          mimirRuler.tenantId,
          mimirRuler.namespace,
          mimirRuler.groupName
        );
        return persistedGroup?.rules.map(getRuleName);
      })
      .toEqual(['TestCloneRule', 'test:recording:rule', 'TestEditRule']);
  });
});
