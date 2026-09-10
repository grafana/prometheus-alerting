import { test, expect } from '../fixtures/alertmanager';

const WEBEX_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: webex-update
  receivers:
    - name: webex-update
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

test.describe('Cisco Webex receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates Webex with authorization and rejects conflicting authentication', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webex-create');
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
    await expect(webex.authorizationCredentialsInput).toHaveAttribute('type', 'password');
    await expect(receiversPage.drawer.getByLabel('Credentials file')).toHaveCount(0);
    await receiversPage.submitCreate();
    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', { exact: true })
    ).toBeVisible();

    await webex.fill({ basicAuthUsername: '' });
    await receiversPage.submitCreate();
    await expect(receiversPage.getRow('webex-create')).toBeVisible();
    await receiversPage.openReceiverByName('webex-create');
    await expect(receiversPage.getViewFieldValue('room_id')).toHaveText('room-create');
    await expect(receiversPage.getViewFieldValue('type')).toHaveText('Bearer');
    await expect(receiversPage.getViewFieldValue('credentials')).toHaveText(/^\*+$/);
    await expect(receiversPage.drawer.getByText('bearer_token', { exact: true })).toHaveCount(0);
  });

  test('updates Webex and migrates legacy bearer authentication', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(WEBEX_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('webex-update');
    await receiversPage.startEdit();
    const webex = await receiversPage.selectWebexIntegration(0);
    await expect(webex.authorizationTypeInput).toHaveValue('Bearer');
    await expect(webex.authorizationCredentialsInput).toHaveValue('token-before');
    await webex.fill({ roomId: 'room-after', message: 'After Webex message', authorizationCredentials: 'token-after' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('webex-update');
    await expect(receiversPage.getViewFieldValue('room_id')).toHaveText('room-after');
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('After Webex message');
    await expect(receiversPage.getViewFieldValue('type')).toHaveText('Bearer');
    await expect(receiversPage.getViewFieldValue('credentials')).toHaveText(/^\*+$/);
    await expect(receiversPage.drawer.getByText('bearer_token', { exact: true })).toHaveCount(0);
  });

  test('shows required room and authorization errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('webex-validation');
    await receiversPage.selectWebexIntegration(0);
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('Room ID is required', { exact: true })).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Webex authorization credentials are required', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('webex-validation')).toBeHidden();
  });
});
