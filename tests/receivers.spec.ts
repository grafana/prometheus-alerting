import { test, expect, VANILLA_ALERTMANAGER_UID } from './fixtures/alertmanager';

const IN_USE_RECEIVER_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
    routes:
      - receiver: in-use-receiver
        matchers:
          - service="api"
  receivers:
    - name: empty-default-receiver
    - name: in-use-receiver
      webhook_configs:
        - url: 'https://example.com/in-use'
`;

const RECEIVER_DETAIL_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: 'detail receiver & team'
  receivers:
    - name: 'detail receiver & team'
      email_configs:
        - to: 'detail@example.com'
          from: 'alerts@example.com'
          smarthost: 'smtp.example.com:587'
          hello: 'detail.example.com'
          headers:
            X-Environment: 'production'
          tls_config:
            server_name: 'smtp.detail.example.com'
      pagerduty_configs:
        - routing_key: 'detail-routing-key'
          details:
            environment: 'production'
          http_config:
            proxy_url: 'http://proxy.detail.example.com:8080'
`;

const TWO_WEBHOOKS_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: two-webhooks
  receivers:
    - name: two-webhooks
      webhook_configs:
        - url: 'https://example.com/first'
          http_config:
            proxy_url: 'http://first-proxy.example.com:8080'
        - url: 'https://example.com/second'
          http_config:
            proxy_url: 'http://second-proxy.example.com:8080'
`;

/**
 * Receivers e2e (`/receivers`).
 *
 * Read tests use the vanilla `test-alertmanager` (6 seeded receivers in
 * test-data/alertmanager/alertmanager.yml, read-only). Write tests use the Mimir
 * a dedicated, fixture-created Mimir tenant (editable). Its initial config leaves a single
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
    test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
      await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    });

    test('creates a receiver with a single email integration', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('new-email-receiver');
      const email = await receiversPage.selectEmailIntegration(0);
      await email.fill({
        to: 'team@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
      });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('new-email-receiver')).toBeVisible();
      await receiversPage.expectReceiverCount(2); // new receiver + undeletable default
    });

    test('edits a receiver', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('edit-me-receiver');
      const email = await receiversPage.selectEmailIntegration(0);
      await email.fill({
        to: 'old@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
      });
      await receiversPage.submitCreate();
      await expect(receiversPage.getRow('edit-me-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('edit-me-receiver');
      await receiversPage.startEdit();
      const editEmail = await receiversPage.selectEmailIntegration(0);
      await editEmail.fill({ to: 'new@example.com' });
      await receiversPage.submitUpdate();

      await receiversPage.openReceiverByName('edit-me-receiver');
      await expect(receiversPage.getViewFieldValue('to')).toHaveText('new@example.com');
    });

    test('deletes a receiver via the confirmation modal', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('delete-me-receiver');
      const webhook = await receiversPage.selectWebhookIntegration(0);
      await webhook.fill({ url: 'http://example.com/delete-me' });
      await receiversPage.submitCreate();
      await expect(receiversPage.getRow('delete-me-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('delete-me-receiver');
      await receiversPage.removeViaDrawer();

      await expect(receiversPage.getRow('delete-me-receiver')).toBeHidden();
      await receiversPage.expectReceiverCount(1); // only the undeletable default remains
    });

    test('blocks deleting a receiver used by a route', async ({ receiversPage, mimirAlertmanager }) => {
      await mimirAlertmanager.seedConfig(IN_USE_RECEIVER_CONFIG);
      await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
      await receiversPage.openReceiverByName('in-use-receiver');

      await expect(receiversPage.deleteButton).toBeDisabled();
      await receiversPage.deleteButton.hover();
      await expect(
        receiversPage.page.getByText('Cannot delete a receiver used by a route', { exact: true })
      ).toBeVisible();
      await expect(receiversPage.confirmDeleteModal).toBeHidden();
    });

    test('opens a receiver detail URL with special characters and complete integration fields', async ({
      receiversPage,
      mimirAlertmanager,
    }) => {
      await mimirAlertmanager.seedConfig(RECEIVER_DETAIL_CONFIG);
      await receiversPage.gotoReceiverDetail(mimirAlertmanager.uid, 'detail receiver & team');

      await expect(receiversPage.detailContainer.getByRole('textbox', { name: /^Name\b/ })).toHaveValue(
        'detail receiver & team'
      );
      await expect(receiversPage.detailContainer.getByText('email', { exact: true })).toBeVisible();
      await expect(receiversPage.detailContainer.getByText('pagerduty', { exact: true })).toBeVisible();
      await expect(receiversPage.detailContainer.getByText('detail.example.com', { exact: true })).toBeVisible();
      await expect(receiversPage.detailContainer.getByText('X-Environment', { exact: true })).toBeVisible();
      await expect(receiversPage.detailContainer.getByText('smtp.detail.example.com', { exact: true })).toBeVisible();
      await expect(receiversPage.detailContainer.getByText('environment', { exact: true })).toBeVisible();
      await expect(
        receiversPage.detailContainer.getByText('http://proxy.detail.example.com:8080', { exact: true })
      ).toBeVisible();
    });

    test('keeps repeated integrations and their HTTP configurations distinguishable', async ({
      receiversPage,
      mimirAlertmanager,
    }) => {
      await mimirAlertmanager.seedConfig(TWO_WEBHOOKS_CONFIG);
      await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
      await receiversPage.openReceiverByName('two-webhooks');

      await expect(receiversPage.drawer.getByText('webhook', { exact: true })).toHaveCount(2);
      await expect(receiversPage.drawer.getByText('HTTP Configuration', { exact: true })).toHaveCount(2);
      await expect(
        receiversPage.drawer.getByText('http://first-proxy.example.com:8080', { exact: true })
      ).toBeVisible();
      await expect(
        receiversPage.drawer.getByText('http://second-proxy.example.com:8080', { exact: true })
      ).toBeVisible();
    });

    test('creates a receiver with two integrations', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('multi-integration-receiver');
      const webhook = await receiversPage.selectWebhookIntegration(0);
      await webhook.fill({ url: 'http://example.com/multi' });

      await receiversPage.addIntegrationButton.click();
      const email = await receiversPage.selectEmailIntegration(1);
      await email.fill({
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
