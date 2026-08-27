import { test, expect } from '../fixtures/alertmanager';

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
          headers:
            X-Existing: 'preserve-me'
          tls_config:
            server_name: 'before-tls.example.com'
            insecure_skip_verify: true
`;

test.describe('Email receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates an email receiver with optional, secret, header, and TLS fields', async ({ receiversPage }) => {
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
    await email.addHeader('X-Environment', 'e2e');

    // #1943 and #1944: passwords are masked and Mimir-only forms do not expose invalid TLS files.
    await expect(email.authPasswordInput).toHaveAttribute('type', 'password');
    await expect(receiversPage.drawer.getByLabel(/^(CA|Cert|Key) file$/)).toHaveCount(0);
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('email-full-options')).toBeVisible();
    await receiversPage.openReceiverByName('email-full-options');
    await expect(receiversPage.getViewFieldValue('to')).toHaveText('team@example.com');
    await expect(receiversPage.getViewFieldValue('from')).toHaveText('alerts@example.com');
    await expect(receiversPage.getViewFieldValue('smarthost')).toHaveText('smtp.example.com:587');
    await expect(receiversPage.getViewFieldValue('hello')).toHaveText('alertmanager.example.com');
    await expect(receiversPage.getViewFieldValue('auth_username')).toHaveText('emailuser');
    await expect(receiversPage.getViewFieldValue('auth_password')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('auth_password')).not.toHaveText('emailpass');
    await expect(receiversPage.getViewFieldValue('require_tls')).toHaveText('Yes');
    await expect(receiversPage.getViewFieldValue('html')).toHaveText('Full HTML body');
    await expect(receiversPage.getViewFieldValue('text')).toHaveText('Full text body');
    await expect(receiversPage.drawer.getByText('X-Environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('e2e', { exact: true })).toBeVisible();
    await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('email.example.com');
    await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('Yes');
  });

  test('updates an email receiver and preserves structured fields', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(EMAIL_FULL_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await receiversPage.openReceiverByName('email-full-update');
    await receiversPage.startEdit();
    const email = await receiversPage.selectEmailIntegration(0);
    await email.fill({
      to: 'after@example.com',
      from: 'after-from@example.com',
      smarthost: 'smtp-after.example.com:587',
      hello: 'after.example.com',
      authUsername: 'after-user',
      authPassword: 'after-pass',
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
    await expect(receiversPage.getViewFieldValue('auth_username')).toHaveText('after-user');
    await expect(receiversPage.getViewFieldValue('auth_password')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('require_tls')).toHaveText('No');
    await expect(receiversPage.drawer.getByText('X-Existing', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('preserve-me', { exact: true })).toBeVisible();
    await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('after-tls.example.com');
    await expect(receiversPage.getViewFieldValue('insecure_skip_verify')).toHaveText('No');
  });

  test('shows recipient validation instead of silently blocking create', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('email-required-validation');
    await receiversPage.selectEmailIntegration(0);
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('Recipient is required', { exact: true })).toBeVisible();
    await expect(receiversPage.getRow('email-required-validation')).toBeHidden();
  });
});
