import { expect, test } from './fixtures/alertmanager';

test.describe('Inhibit rules RBAC - editor', () => {
  test('an editor can create, edit, and delete an inhibit rule', async ({ inhibitRulesPage, mimirAlertmanager }) => {
    await inhibitRulesPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await inhibitRulesPage.openCreateDrawer();
    await inhibitRulesPage.fillForm({
      source: 'alertname = RBACEditorSource',
      target: 'severity = warning',
      equal: 'instance',
    });
    await inhibitRulesPage.submitCreate();

    await expect(inhibitRulesPage.table.getByText(/alertname\s*=\s*RBACEditorSource/i)).toBeVisible();
    await inhibitRulesPage.openRuleByText(/alertname\s*=\s*RBACEditorSource/i);
    await inhibitRulesPage.startEdit();
    await inhibitRulesPage.fillForm({ target: 'severity = info' });
    await inhibitRulesPage.submitUpdate();

    await expect(inhibitRulesPage.table.getByText(/severity\s*=\s*info/i)).toBeVisible();
    await inhibitRulesPage.openRuleByText(/alertname\s*=\s*RBACEditorSource/i);
    await inhibitRulesPage.removeViaDrawer();

    await expect(inhibitRulesPage.emptyStateMessage).toBeVisible();
  });
});
