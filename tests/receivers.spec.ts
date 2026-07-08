import { test, expect, VANILLA_ALERTMANAGER_UID, MIMIR_ALERTMANAGER_UID } from './fixtures/alertmanager';
import { postMimirAlertmanagerConfig } from './api/alertmanagerConfig';

/**
 * A webhook receiver with every optional field set, used as the starting point for the "update"
 * test below — seeded directly via the Mimir config API so the test only has to drive the UI for
 * the part it's actually verifying (the edit).
 */
const WEBHOOK_FULL_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: webhook-full-update
  receivers:
    - name: webhook-full-update
      webhook_configs:
        - url: 'http://example.com/webhook-before'
          max_alerts: 5
          http_config:
            proxy_url: 'http://proxy.example.com:8080'
            basic_auth:
              username: 'before-user'
              password: 'before-pass'
            tls_config:
              server_name: 'before.example.com'
              insecure_skip_verify: true
`;

const EMAIL_FULL_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: email-full-update
  receivers:
    - name: email-full-update
      email_configs:
        - to: 'before@example.com'
          from: 'before-from@example.com'
          smarthost: 'smtp-before.example.com:587'
          hello: 'before.example.com'
          auth_username: 'before-user'
          auth_password: 'before-pass'
          require_tls: true
          html: 'Before HTML body'
          text: 'Before text body'
          tls_config:
            server_name: 'before-tls.example.com'
            insecure_skip_verify: true
`;

const SLACK_FULL_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: slack-full-update
  receivers:
    - name: slack-full-update
      slack_configs:
        - api_url: 'https://hooks.slack.com/services/BEFORE/BEFORE/BEFOREBEFOREBEFOREBEFORE'
          channel: '#before-channel'
          icon_emoji: ':warning:'
          icon_url: 'https://example.com/before-icon.png'
          username: 'before-bot'
          title: 'Before title'
          text: 'Before message body'
`;

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

    test('creates a receiver with a webhook integration and views it', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('new-webhook-receiver');
      const webhook = await receiversPage.selectWebhookIntegration(0);
      await webhook.fill({ url: 'http://example.com/webhook' });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('new-webhook-receiver')).toBeVisible();

      await receiversPage.openReceiverByName('new-webhook-receiver');
      await expect(receiversPage.drawer.getByText('http://example.com/webhook')).toBeVisible();
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

    test('creates a webhook receiver with all optional fields and persists them', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('webhook-full-options');
      const webhook = await receiversPage.selectWebhookIntegration(0);
      await webhook.fill({
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

    test('updates a webhook receiver with all optional fields', async ({ receiversPage }) => {
      await postMimirAlertmanagerConfig(WEBHOOK_FULL_BEFORE_CONFIG);
      await receiversPage.gotoWithAlertmanager(MIMIR_ALERTMANAGER_UID);

      await receiversPage.openReceiverByName('webhook-full-update');
      await receiversPage.startEdit();
      const editWebhook = await receiversPage.selectWebhookIntegration(0);
      await editWebhook.fill({
        url: 'http://example.com/webhook-after',
        maxAlerts: '10',
        proxyUrl: 'http://proxy2.example.com:9090',
        basicAuthUsername: 'after-user',
        basicAuthPassword: 'after-pass',
        tlsServerName: 'after.example.com',
        // Already checked in the seeded config — clicking again toggles it back off.
        tlsSkipVerify: true,
      });
      await receiversPage.submitUpdate();

      await receiversPage.openReceiverByName('webhook-full-update');
      await expect(receiversPage.getViewFieldValue('url')).toHaveText('http://example.com/webhook-after');
      await expect(receiversPage.getViewFieldValue('max_alerts')).toHaveText('10');
      await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy2.example.com:9090');
      await expect(receiversPage.getViewFieldValue('username')).toHaveText('after-user');
      await expect(receiversPage.getViewFieldValue('password')).toHaveText('after-pass');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('after.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('No');
    });

    test('creates an email receiver with all optional fields and persists them', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('email-full-options');
      const email = await receiversPage.selectEmailIntegration(0);
      await email.fill({
        to: 'team@example.com',
        from: 'alerts@example.com',
        smarthost: 'smtp.example.com:587',
        hello: 'alertmanager.example.com',
        authUsername: 'emailuser',
        authPassword: 'emailpass',
        requireTls: true,
        html: 'Full HTML body',
        text: 'Full text body',
        tlsServerName: 'email.example.com',
        tlsSkipVerify: true,
      });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('email-full-options')).toBeVisible();

      await receiversPage.openReceiverByName('email-full-options');
      await expect(receiversPage.getViewFieldValue('to')).toHaveText('team@example.com');
      await expect(receiversPage.getViewFieldValue('from')).toHaveText('alerts@example.com');
      await expect(receiversPage.getViewFieldValue('smarthost')).toHaveText('smtp.example.com:587');
      await expect(receiversPage.getViewFieldValue('hello')).toHaveText('alertmanager.example.com');
      await expect(receiversPage.getViewFieldValue('auth_username')).toHaveText('emailuser');
      await expect(receiversPage.getViewFieldValue('auth_password')).toHaveText('emailpass');
      await expect(receiversPage.getViewFieldValue('require_tls')).toHaveText('Yes');
      await expect(receiversPage.getViewFieldValue('html')).toHaveText('Full HTML body');
      await expect(receiversPage.getViewFieldValue('text')).toHaveText('Full text body');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('email.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('Yes');
    });

    test('updates an email receiver with all optional fields', async ({ receiversPage }) => {
      await postMimirAlertmanagerConfig(EMAIL_FULL_BEFORE_CONFIG);
      await receiversPage.gotoWithAlertmanager(MIMIR_ALERTMANAGER_UID);

      await receiversPage.openReceiverByName('email-full-update');
      await receiversPage.startEdit();
      const editEmail = await receiversPage.selectEmailIntegration(0);
      await editEmail.fill({
        to: 'after@example.com',
        from: 'after-from@example.com',
        smarthost: 'smtp-after.example.com:587',
        hello: 'after.example.com',
        authUsername: 'after-user',
        authPassword: 'after-pass',
        // Already checked in the seeded config — clicking again toggles it back off.
        requireTls: true,
        html: 'After HTML body',
        text: 'After text body',
        tlsServerName: 'after-tls.example.com',
        tlsSkipVerify: true,
      });
      await receiversPage.submitUpdate();

      await receiversPage.openReceiverByName('email-full-update');
      await expect(receiversPage.getViewFieldValue('to')).toHaveText('after@example.com');
      await expect(receiversPage.getViewFieldValue('from')).toHaveText('after-from@example.com');
      await expect(receiversPage.getViewFieldValue('smarthost')).toHaveText('smtp-after.example.com:587');
      await expect(receiversPage.getViewFieldValue('hello')).toHaveText('after.example.com');
      await expect(receiversPage.getViewFieldValue('auth_username')).toHaveText('after-user');
      await expect(receiversPage.getViewFieldValue('auth_password')).toHaveText('after-pass');
      await expect(receiversPage.getViewFieldValue('require_tls')).toHaveText('No');
      await expect(receiversPage.getViewFieldValue('html')).toHaveText('After HTML body');
      await expect(receiversPage.getViewFieldValue('text')).toHaveText('After text body');
      await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('after-tls.example.com');
      await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('No');
    });

    test('creates a slack receiver with all optional fields and persists them', async ({ receiversPage }) => {
      await receiversPage.openCreateDrawer();
      await receiversPage.fillName('slack-full-options');
      const slack = await receiversPage.selectSlackIntegration(0);
      await slack.fill({
        apiUrl: 'https://hooks.slack.com/services/TEAM/BOT/TOKENTOKENTOKENTOKENTOKE',
        channel: '#alerts',
        iconEmoji: ':bell:',
        iconUrl: 'https://example.com/icon.png',
        username: 'Alertmanager',
        title: 'Full title',
        text: 'Full message body',
      });
      await receiversPage.submitCreate();

      await expect(receiversPage.getRow('slack-full-options')).toBeVisible();

      await receiversPage.openReceiverByName('slack-full-options');
      await expect(receiversPage.getViewFieldValue('api_url')).toHaveText(
        'https://hooks.slack.com/services/TEAM/BOT/TOKENTOKENTOKENTOKENTOKE'
      );
      await expect(receiversPage.getViewFieldValue('channel')).toHaveText('#alerts');
      await expect(receiversPage.getViewFieldValue('icon_emoji')).toHaveText(':bell:');
      await expect(receiversPage.getViewFieldValue('icon_url')).toHaveText('https://example.com/icon.png');
      await expect(receiversPage.getViewFieldValue('username')).toHaveText('Alertmanager');
      await expect(receiversPage.getViewFieldValue('title')).toHaveText('Full title');
      await expect(receiversPage.getViewFieldValue('text')).toHaveText('Full message body');
    });

    test('updates a slack receiver with all optional fields', async ({ receiversPage }) => {
      await postMimirAlertmanagerConfig(SLACK_FULL_BEFORE_CONFIG);
      await receiversPage.gotoWithAlertmanager(MIMIR_ALERTMANAGER_UID);

      await receiversPage.openReceiverByName('slack-full-update');
      await receiversPage.startEdit();
      const editSlack = await receiversPage.selectSlackIntegration(0);
      await editSlack.fill({
        apiUrl: 'https://hooks.slack.com/services/AFTER/AFTER/AFTERAFTERAFTERAFTERAFT',
        channel: '#after-channel',
        iconEmoji: ':white_check_mark:',
        iconUrl: 'https://example.com/after-icon.png',
        username: 'after-bot',
        title: 'After title',
        text: 'After message body',
      });
      await receiversPage.submitUpdate();

      await receiversPage.openReceiverByName('slack-full-update');
      await expect(receiversPage.getViewFieldValue('api_url')).toHaveText(
        'https://hooks.slack.com/services/AFTER/AFTER/AFTERAFTERAFTERAFTERAFT'
      );
      await expect(receiversPage.getViewFieldValue('channel')).toHaveText('#after-channel');
      await expect(receiversPage.getViewFieldValue('icon_emoji')).toHaveText(':white_check_mark:');
      await expect(receiversPage.getViewFieldValue('icon_url')).toHaveText('https://example.com/after-icon.png');
      await expect(receiversPage.getViewFieldValue('username')).toHaveText('after-bot');
      await expect(receiversPage.getViewFieldValue('title')).toHaveText('After title');
      await expect(receiversPage.getViewFieldValue('text')).toHaveText('After message body');
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
