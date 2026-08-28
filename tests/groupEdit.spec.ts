import { getRuleName } from '@grafana/external-rules/utils';
import { expect, test } from './fixtures/ruler';
import { getMimirRuleGroup, postMimirRuleGroup } from './api/mimir';
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
        const persistedGroup = await getMimirRuleGroup(mimirRuler.tenantId, mimirRuler.namespace, mimirRuler.groupName);
        return persistedGroup?.rules.map(getRuleName);
      })
      .toEqual(['TestCloneRule', 'test:recording:rule', 'TestEditRule']);
  });

  test('keeps the group settings the form has no field for', async ({ groupEditPage, mimirRuler, mimirGroup }) => {
    const groupName = mimirGroup('tuned');
    await postMimirRuleGroup(
      mimirRuler.tenantId,
      mimirRuler.namespace,
      `name: ${groupName}
interval: 1m
limit: 10
query_offset: 2m
align_evaluation_time_on_interval: true
rules:
  - alert: TunedRule
    expr: up == 0
    for: 5m
`
    );

    await groupEditPage.goto(mimirRuler.uid, mimirRuler.namespace, groupName);
    await groupEditPage.waitForLoad();
    await groupEditPage.pageContent.getByRole('button', { name: '30s', exact: true }).click();
    await groupEditPage.saveButton.click();

    // The payload used to be rebuilt from name, interval and rules alone, so a group edit dropped
    // the group's limit and query offset
    await expect
      .poll(async () => getMimirRuleGroup(mimirRuler.tenantId, mimirRuler.namespace, groupName))
      .toMatchObject({
        interval: '30s',
        limit: 10,
        query_offset: '2m',
        align_evaluation_time_on_interval: true,
      });
  });

  test('offers no form for a federated group', async ({ groupEditPage, mimirRuler, mimirGroup, page }) => {
    const groupName = mimirGroup('federated');
    await postMimirRuleGroup(
      mimirRuler.tenantId,
      mimirRuler.namespace,
      `name: ${groupName}
interval: 1m
source_tenants: [tenant-a, tenant-b]
rules:
  - alert: FederatedRule
    expr: up == 0
    for: 5m
`
    );

    await groupEditPage.goto(mimirRuler.uid, mimirRuler.namespace, groupName);

    // source_tenants decides which tenants the rules read, and this form cannot express that --
    // saving through it would quietly turn the group single-tenant
    await expect(page.getByRole('status', { name: 'This group is federated' })).toBeVisible();
    await expect(groupEditPage.intervalInput).toHaveCount(0);
    await expect(groupEditPage.saveButton).toHaveCount(0);
  });
});
