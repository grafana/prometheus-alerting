import { test, expect } from '../fixtures/alertmanager';

/**
 * A webhook receiver with every optional field set, used as the starting point for the update test.
 * It is seeded through Mimir so the test only drives the edit flow it verifies.
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

test.describe('Webhook receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a minimal webhook receiver without materializing optional values', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webhook-minimal');
    const webhook = await receiversPage.selectWebhookIntegration(0);
    await webhook.fill({ url: 'http://example.com/webhook' });
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('webhook-minimal')).toBeVisible();
    await receiversPage.openReceiverByName('webhook-minimal');
    await expect(receiversPage.getViewFieldValue('url')).toHaveText('http://example.com/webhook');
    await expect(receiversPage.getViewFieldValue('max_alerts')).toHaveCount(0);

    // Regression coverage for #1950: leaving Max alerts untouched must not materialize it as 0.
    await receiversPage.startEdit();
    const savedWebhook = await receiversPage.selectWebhookIntegration(0);
    await expect(savedWebhook.maxAlertsInput).toHaveValue('');
  });

  test('creates a webhook receiver with optional and secret fields', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webhook-full-options');
    const webhook = await receiversPage.selectWebhookIntegration(0);
    await webhook.fill({
      url: 'http://example.com/webhook-full',
      maxAlerts: '5',
      authorizationType: 'Bearer',
      authorizationCredentials: 'webhook-token',
      proxyUrl: 'http://proxy.example.com:8080',
      tlsServerName: 'webhook.example.com',
      tlsSkipVerify: true,
    });

    // Regression coverage for #1943 and #1944: secrets stay masked and Mimir-only forms do not
    // expose local TLS file settings that Mimir will always reject.
    await expect(webhook.authorizationCredentialsInput).toHaveAttribute('type', 'password');
    await expect(receiversPage.drawer.getByLabel(/^(CA|Cert|Key) file$/)).toHaveCount(0);
    await receiversPage.submitCreate();

    // A string-valued max_alerts used to make Mimir reject the whole create request.
    await expect(receiversPage.getRow('webhook-full-options')).toBeVisible();
    await receiversPage.openReceiverByName('webhook-full-options');
    await expect(receiversPage.getViewFieldValue('url')).toHaveText('http://example.com/webhook-full');
    await expect(receiversPage.getViewFieldValue('max_alerts')).toHaveText('5');
    await expect(receiversPage.getViewFieldValue('type')).toHaveText('Bearer');
    await expect(receiversPage.getViewFieldValue('credentials')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('credentials')).not.toHaveText('webhook-token');
    await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy.example.com:8080');
    await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('webhook.example.com');
    await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('Yes');
  });

  test('updates a webhook receiver and persists changed fields', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(WEBHOOK_FULL_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await receiversPage.openReceiverByName('webhook-full-update');
    await receiversPage.startEdit();
    const webhook = await receiversPage.selectWebhookIntegration(0);
    await webhook.fill({
      url: 'http://example.com/webhook-after',
      maxAlerts: '10',
      proxyUrl: 'http://proxy2.example.com:9090',
      basicAuthUsername: 'after-user',
      basicAuthPassword: 'after-pass',
      tlsServerName: 'after.example.com',
      // Already checked in the seeded config; clicking toggles it off.
      tlsSkipVerify: true,
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('webhook-full-update');
    await expect(receiversPage.getViewFieldValue('url')).toHaveText('http://example.com/webhook-after');
    await expect(receiversPage.getViewFieldValue('max_alerts')).toHaveText('10');
    await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy2.example.com:9090');
    await expect(receiversPage.getViewFieldValue('username')).toHaveText('after-user');
    await expect(receiversPage.getViewFieldValue('password')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('password')).not.toHaveText('after-pass');
    await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('after.example.com');
    await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('No');
  });

  test('shows required URL and max alerts validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webhook-field-validation');
    await receiversPage.selectWebhookIntegration(0);
    await receiversPage.submitCreate();

    // Regression coverage for #1942: required-field validation used to block submission silently.
    await expect(receiversPage.drawer.getByText('Webhook URL is required', { exact: true })).toBeVisible();

    // Start with a fresh form so this second submission independently exercises value validation.
    await receiversPage.cancelButton.click();
    await expect(receiversPage.drawer).toBeHidden();
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webhook-value-validation');
    const invalidWebhook = await receiversPage.selectWebhookIntegration(0);
    await invalidWebhook.fill({ url: 'https://example.com/webhook', maxAlerts: '-1' });
    await receiversPage.submitCreate();
    await expect(
      receiversPage.drawer.getByText('Max alerts must be a non-negative integer', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('webhook-field-validation')).toBeHidden();
    await expect(receiversPage.getRow('webhook-value-validation')).toBeHidden();
  });

  test('shows cross-field validation for conflicting HTTP settings', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webhook-cross-field-validation');
    const webhook = await receiversPage.selectWebhookIntegration(0);
    await webhook.fill({
      url: 'https://example.com/webhook',
      authorizationCredentials: 'authorization-token',
      basicAuthUsername: 'basic-user',
      proxyUrl: 'http://proxy.example.com:8080',
      proxyFromEnvironment: true,
    });
    await receiversPage.submitCreate();

    // #1941 specifically identified that authorization plus basic auth was accepted because one
    // value was discarded before cross-field validation.
    await expect(
      receiversPage.drawer.getByText('Only one of authorization, basic authentication, or OAuth2 can be used', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Proxy URL and proxy from environment cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('webhook-cross-field-validation')).toBeHidden();
  });
});
