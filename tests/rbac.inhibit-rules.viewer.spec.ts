import { expect, test } from './fixtures/alertmanager';

const READABLE_INHIBIT_RULE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
  receivers:
    - name: empty-default-receiver
  inhibit_rules:
    - source_matchers:
        - alertname = RBACViewerSource
      target_matchers:
        - severity = warning
      equal:
        - instance
`;

test.describe('Inhibit rules RBAC - viewer', () => {
  test('a viewer can inspect inhibit rules but cannot access mutation actions', async ({
    inhibitRulesPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(READABLE_INHIBIT_RULE_CONFIG);
    await inhibitRulesPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(inhibitRulesPage.table.getByText(/alertname\s*=\s*RBACViewerSource/i)).toBeVisible();
    await expect(inhibitRulesPage.addButton).toHaveCount(0);

    await inhibitRulesPage.openRuleByText(/alertname\s*=\s*RBACViewerSource/i);
    await expect(inhibitRulesPage.drawer.getByText('severity = warning')).toBeVisible();
    await expect(inhibitRulesPage.editButton).toHaveCount(0);
    await expect(inhibitRulesPage.removeButton).toHaveCount(0);
  });
});
