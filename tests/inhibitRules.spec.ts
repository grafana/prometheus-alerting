import { test, expect } from './fixtures/alertmanager';

/**
 * Inhibit Rules e2e (`/inhibit-rules`).
 *
 * Read tests use the vanilla `test-alertmanager` (3 seeded rules in
 * test-data/alertmanager/alertmanager.yml, read-only). Write tests use the Mimir
 * `test-mimir-alertmanager` (editable, starts empty).
 *
 * Inhibit rules are the plugin's flagship differentiator vs Grafana (which has no such UI).
 */

const VANILLA_UID = 'test-alertmanager';
const MIMIR_UID = 'test-mimir-alertmanager';
const MIMIR_NAME = 'Test Mimir Alertmanager';

test.describe('Inhibit Rules', () => {
  test.describe('Vanilla Alertmanager (read-only)', () => {
    test.beforeEach(async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.gotoWithAlertmanager(VANILLA_UID);
    });

    test('shows the seeded inhibit rules', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.expectRuleCount(3);
      // First seeded rule: severity=critical → severity=warning, equal [alertname, instance].
      await expect(inhibitRulesPage.table.getByText(/severity\s*=\s*critical/i).first()).toBeVisible();
      await expect(inhibitRulesPage.table.getByText(/severity\s*=\s*warning/i).first()).toBeVisible();
    });

    test('does not offer to add a rule (no configuration API)', async ({ inhibitRulesPage }) => {
      await expect(inhibitRulesPage.addButton).toBeHidden();
    });

    test('opens a read-only drawer with no edit/remove actions', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.openRuleByText(/severity\s*=\s*critical/i);

      // Drawer shows the rule details...
      await expect(inhibitRulesPage.page.getByText('Source Matchers').first()).toBeVisible();
      await expect(inhibitRulesPage.page.getByText('Target Matchers').first()).toBeVisible();
      // ...but read-only Alertmanagers expose no Edit/Remove footer.
      await expect(inhibitRulesPage.editButton).toBeHidden();
      await expect(inhibitRulesPage.removeButton).toBeHidden();
    });
  });

  test.describe('Alertmanager picker', () => {
    test('selecting a Mimir Alertmanager reveals the Add button', async ({ inhibitRulesPage }) => {
      // Default selection is the first AM (vanilla) → no Add button.
      await inhibitRulesPage.goto();
      await inhibitRulesPage.waitForLoad();
      await expect(inhibitRulesPage.addButton).toBeHidden();

      await inhibitRulesPage.selectAlertmanager(MIMIR_NAME);
      await expect(inhibitRulesPage.addButton).toBeVisible();
    });
  });

  test.describe('Mimir Alertmanager (CRUD)', () => {
    // Mimir stores one config per tenant → serialize and reset between tests.
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ inhibitRulesPage, resetMimirConfig }) => {
      await resetMimirConfig();
      await inhibitRulesPage.gotoWithAlertmanager(MIMIR_UID);
    });

    test('empty state offers to create a rule', async ({ inhibitRulesPage }) => {
      await expect(inhibitRulesPage.emptyStateMessage).toBeVisible();
      await expect(inhibitRulesPage.addButton).toBeVisible();
      await inhibitRulesPage.addButton.click();
      await expect(inhibitRulesPage.sourceMatchersInput).toBeVisible();
    });

    test('creates an inhibit rule', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.openCreateDrawer();
      await inhibitRulesPage.fillForm({
        source: 'alertname = TestAlert',
        target: 'severity = warning',
        equal: 'job',
      });
      await inhibitRulesPage.submitCreate();

      await expect(inhibitRulesPage.table.getByText(/alertname\s*=\s*TestAlert/i)).toBeVisible();
      await expect(inhibitRulesPage.table.getByText(/severity\s*=\s*warning/i)).toBeVisible();
      await inhibitRulesPage.expectRuleCount(1);
    });

    test('edits an inhibit rule', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.openCreateDrawer();
      await inhibitRulesPage.fillForm({ source: 'alertname = EditMe', target: 'severity = warning' });
      await inhibitRulesPage.submitCreate();
      await expect(inhibitRulesPage.table.getByText(/alertname\s*=\s*EditMe/i)).toBeVisible();

      await inhibitRulesPage.openRuleByText(/alertname\s*=\s*EditMe/i);
      await inhibitRulesPage.startEdit();
      await inhibitRulesPage.fillForm({ target: 'severity = info' });
      await inhibitRulesPage.submitUpdate();

      await expect(inhibitRulesPage.table.getByText(/severity\s*=\s*info/i)).toBeVisible();
      await inhibitRulesPage.expectRuleCount(1);
    });

    test('deletes an inhibit rule', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.openCreateDrawer();
      await inhibitRulesPage.fillForm({ source: 'alertname = DeleteMe', target: 'severity = warning' });
      await inhibitRulesPage.submitCreate();
      await expect(inhibitRulesPage.table.getByText(/alertname\s*=\s*DeleteMe/i)).toBeVisible();

      await inhibitRulesPage.openRuleByText(/alertname\s*=\s*DeleteMe/i);
      await inhibitRulesPage.removeViaDrawer();

      await expect(inhibitRulesPage.emptyStateMessage).toBeVisible();
    });

    test('validates that source and target matchers are required', async ({ inhibitRulesPage }) => {
      await inhibitRulesPage.openCreateDrawer();
      await inhibitRulesPage.submitCreate();

      await expect(inhibitRulesPage.page.getByText(/at least one source matcher is required/i)).toBeVisible();
      await expect(inhibitRulesPage.page.getByText(/at least one target matcher is required/i)).toBeVisible();
    });
  });
});
