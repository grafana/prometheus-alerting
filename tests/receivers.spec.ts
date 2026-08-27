import { test, expect, VANILLA_ALERTMANAGER_UID } from './fixtures/alertmanager';

const WEBEX_FULL_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: webex-full-update
  receivers:
    - name: webex-full-update
      webex_configs:
        - api_url: 'https://webexapis.com/v1/messages-before'
          room_id: 'room-before'
          message: 'Before Webex message'
          http_config:
            bearer_token: 'token-before'
            proxy_url: 'http://proxy-before.example.com:8080'
            tls_config:
              server_name: 'webex-before.example.com'
              insecure_skip_verify: true
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

    test('creates a Webex receiver with all supported fields and persists them', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('webex-full-options');
      const webex = await receiversPage.selectWebexIntegration(0);
      await webex.fill({
        apiUrl: 'https://webexapis.com/v1/messages',
        roomId: 'room-create',
        message: 'Created Webex message',
        authorizationType: 'Bearer',
        authorizationCredentials: 'token-create',
        basicAuthUsername: 'conflicting-user',
        proxyUrl: 'http://proxy-create.example.com:8080',
        tlsServerName: 'webex-create.example.com',
        tlsSkipVerify: true,
      });
      await expect(receiversPage.drawer.getByLabel('Credentials file')).toHaveCount(0);
      await receiversPage.submitCreate();
      await expect(
        receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together')
      ).toBeVisible();

      await webex.fill({ basicAuthUsername: '' });
      await receiversPage.submitCreate();
      await expect(receiversPage.getRow('webex-full-options')).toBeVisible();

      await receiversPage.openReceiverByName('webex-full-options');
      await expect(receiversPage.getViewFieldValue('api_url')).toHaveText('https://webexapis.com/v1/messages');
      await expect(receiversPage.getViewFieldValue('room_id')).toHaveText('room-create');
      await expect(receiversPage.getViewFieldValue('message')).toHaveText('Created Webex message');
      await expect(receiversPage.getViewFieldValue('type')).toHaveText('Bearer');
      await expect(receiversPage.getViewFieldValue('credentials')).toHaveText(/^\*+$/);
      await expect(receiversPage.drawer.getByText('bearer_token', { exact: true })).toHaveCount(0);
      await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy-create.example.com:8080');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('webex-create.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('Yes');
    });

    test('updates a Webex receiver with all supported fields', async ({ receiversPage, mimirAlertmanager }) => {
      await mimirAlertmanager.seedConfig(WEBEX_FULL_BEFORE_CONFIG);
      await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

      await receiversPage.openReceiverByName('webex-full-update');
      await receiversPage.startEdit();
      const editWebex = await receiversPage.selectWebexIntegration(0);
      await expect(editWebex.authorizationTypeInput).toHaveValue('Bearer');
      await expect(editWebex.authorizationCredentialsInput).toHaveValue('token-before');
      await expect(editWebex.authorizationCredentialsInput).toHaveAttribute('type', 'password');
      await editWebex.fill({
        apiUrl: 'https://webexapis.com/v1/messages-after',
        roomId: 'room-after',
        message: 'After Webex message',
        authorizationCredentials: 'token-after',
        proxyUrl: 'http://proxy-after.example.com:9090',
        tlsServerName: 'webex-after.example.com',
        // Already checked in the seeded config — clicking again toggles it back off.
        tlsSkipVerify: true,
      });
      await receiversPage.submitUpdate();
      await expect(receiversPage.drawer).toBeHidden();

      await receiversPage.openReceiverByName('webex-full-update');
      await expect(receiversPage.getViewFieldValue('api_url')).toHaveText('https://webexapis.com/v1/messages-after');
      await expect(receiversPage.getViewFieldValue('room_id')).toHaveText('room-after');
      await expect(receiversPage.getViewFieldValue('message')).toHaveText('After Webex message');
      await expect(receiversPage.getViewFieldValue('type')).toHaveText('Bearer');
      await expect(receiversPage.getViewFieldValue('credentials')).toHaveText(/^\*+$/);
      await expect(receiversPage.drawer.getByText('bearer_token', { exact: true })).toHaveCount(0);
      await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy-after.example.com:9090');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('webex-after.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('No');
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
