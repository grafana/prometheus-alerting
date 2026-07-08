import { test, expect, VANILLA_ALERTMANAGER_UID, MIMIR_ALERTMANAGER_UID } from './fixtures/alertmanager';

/**
 * Receivers e2e (`/receivers`).
 *
 * Read tests use the vanilla `test-alertmanager` (6 seeded receivers in
 * test-data/alertmanager/alertmanager.yml, read-only). Write tests use the Mimir
 * `test-mimir-alertmanager` (editable). Resetting the Mimir config leaves a single
 * `empty-default-receiver` (the route's default receiver, undeletable) — not zero receivers.
 */

test.describe('Receivers', () => {
  test.describe('Vanilla Alertmanager (read-only)', () => {
    test.beforeEach(async ({ receiversPage }) => {
      await receiversPage.gotoWithAlertmanager(VANILLA_ALERTMANAGER_UID);
    });

    test('shows the seeded receivers with their integration summaries', async ({ receiversPage }) => {
      await receiversPage.expectReceiverCount(6);
      await expect(receiversPage.getRow('default')).toBeVisible();
      await expect(receiversPage.getRow('pagerduty')).toBeVisible();
      await expect(receiversPage.getRow('slack-critical')).toBeVisible();
      await expect(receiversPage.getRow('slack-platform')).toBeVisible();
      await expect(receiversPage.getRow('email-platform')).toBeVisible();
      await expect(receiversPage.getRow('mixed')).toBeVisible();

      await expect(receiversPage.getRow('email-platform')).toContainText(/email/i);
      const mixedSummary = await receiversPage.getIntegrationsSummary('mixed');
      expect(mixedSummary).toMatch(/slack/i);
      expect(mixedSummary).toMatch(/pagerduty/i);
      expect(mixedSummary).toMatch(/email/i);
    });

    test('does not offer to create a receiver (no configuration API)', async ({ receiversPage }) => {
      await expect(receiversPage.createButton).toBeHidden();
    });

    test('opens a read-only drawer showing the integration config', async ({ receiversPage }) => {
      await receiversPage.openReceiverByName('email-platform');

      await expect(receiversPage.drawer.getByText('email', { exact: true })).toBeVisible();
      await expect(receiversPage.getViewFieldValue('to')).toHaveText('platform-team@example.com');
      await expect(receiversPage.getViewFieldValue('from')).toHaveText('alertmanager@example.com');
      await expect(receiversPage.getViewFieldValue('smarthost')).toHaveText('smtp.example.com:587');

      // Read-only Alertmanagers expose no Edit/Delete footer.
      await expect(receiversPage.editButton).toBeHidden();
      await expect(receiversPage.deleteButton).toBeHidden();
    });

    test('closing the drawer returns to the list', async ({ receiversPage }) => {
      await receiversPage.openReceiverByName('email-platform');
      await receiversPage.closeDrawer();
      await receiversPage.expectReceiverCount(6);
    });
  });

  test.describe('Mimir Alertmanager (CRUD)', () => {
    // Mimir stores one config per tenant → serialize and reset between tests.
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ receiversPage, resetMimirConfig }) => {
      await resetMimirConfig();
      await receiversPage.gotoWithAlertmanager(MIMIR_ALERTMANAGER_UID);
    });

    test('creates a receiver with a single email integration', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('new-email-receiver');
      await receiversPage.selectIntegrationType(0, 'Email');
      await receiversPage.fillEmailFields({
        to: 'team@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
      });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('new-email-receiver')).toBeVisible();
      await receiversPage.expectReceiverCount(2); // new receiver + undeletable default
    });

    test('creates a receiver with a webhook integration and views it', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('new-webhook-receiver');
      await receiversPage.selectIntegrationType(0, 'Webhook');
      await receiversPage.fillWebhookFields({ url: 'http://example.com/webhook' });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('new-webhook-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('new-webhook-receiver');
      await expect(receiversPage.drawer.getByText('http://example.com/webhook')).toBeVisible();
    });

    test('edits a receiver', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('edit-me-receiver');
      await receiversPage.selectIntegrationType(0, 'Email');
      await receiversPage.fillEmailFields({
        to: 'old@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
      });
      await receiversPage.submitCreate();
      await expect(receiversPage.getRow('edit-me-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('edit-me-receiver');
      await receiversPage.startEdit();
      await receiversPage.fillEmailFields({ to: 'new@example.com' });
      await receiversPage.submitUpdate();

      await receiversPage.openReceiverByName('edit-me-receiver');
      await expect(receiversPage.getViewFieldValue('to')).toHaveText('new@example.com');
    });

    test('deletes a receiver via the confirmation modal', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('delete-me-receiver');
      await receiversPage.selectIntegrationType(0, 'Webhook');
      await receiversPage.fillWebhookFields({ url: 'http://example.com/delete-me' });
      await receiversPage.submitCreate();
      await expect(receiversPage.getRow('delete-me-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('delete-me-receiver');
      await receiversPage.removeViaDrawer();

      await expect(receiversPage.getRow('delete-me-receiver')).toBeHidden();
      await receiversPage.expectReceiverCount(1); // only the undeletable default remains
    });

    test('creates a webhook receiver with all optional fields and persists them', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('webhook-full-options');
      await receiversPage.selectIntegrationType(0, 'Webhook');
      await receiversPage.fillWebhookFields({
        url: 'http://example.com/webhook-full',
        maxAlerts: '5',
        proxyUrl: 'http://proxy.example.com:8080',
        basicAuthUsername: 'webhookuser',
        basicAuthPassword: 'webhookpass',
        tlsServerName: 'webhook.example.com',
        tlsSkipVerify: true,
      });
      await receiversPage.submitCreate();

      // Regression check for `max_alerts`: it's a number field, but react-hook-form registers
      // number inputs as strings unless told otherwise. Without applying the option's
      // `setValueAs`, the receiver is posted with `max_alerts: "5"` (a quoted string), which
      // Mimir's Alertmanager rejects outright — the create request fails and the drawer never
      // closes, so this row never appears.
      await expect(receiversPage.getRow('webhook-full-options')).toBeVisible();

      await receiversPage.openReceiverByName('webhook-full-options');
      await expect(receiversPage.getViewFieldValue('url')).toHaveText('http://example.com/webhook-full');
      await expect(receiversPage.getViewFieldValue('max_alerts')).toHaveText('5');
      await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy.example.com:8080');
      await expect(receiversPage.getViewFieldValue('username')).toHaveText('webhookuser');
      await expect(receiversPage.getViewFieldValue('password')).toHaveText('webhookpass');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('webhook.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('Yes');
    });

    test('creates a receiver with two integrations', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('multi-integration-receiver');
      await receiversPage.selectIntegrationType(0, 'Webhook');
      await receiversPage.fillWebhookFields({ url: 'http://example.com/multi' });

      await receiversPage.addIntegrationButton.click();
      await receiversPage.selectIntegrationType(1, 'Email');
      await receiversPage.fillEmailFields({
        to: 'multi@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
      });

      await receiversPage.submitCreate();

      await receiversPage.openReceiverByName('multi-integration-receiver');
      await expect(receiversPage.drawer.getByText('http://example.com/multi')).toBeVisible();
      await expect(receiversPage.drawer.getByText('multi@example.com')).toBeVisible();
    });
  });
});
