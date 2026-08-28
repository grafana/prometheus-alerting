import { test, expect } from '../fixtures/alertmanager';

const PUSHOVER_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: pushover-update
  receivers:
    - name: pushover-update
      pushover_configs:
        - user_key: 'before-user-key'
          token: 'before-token'
          title: 'Before title'
          message: 'Before message'
          priority: '0'
          ttl: '5m'
`;

test.describe('Pushover receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Pushover receiver with supported optional fields', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('pushover-create');
    const pushover = await receiversPage.selectPushoverIntegration(0);
    await pushover.fill({
      userKey: 'create-user-key',
      token: 'create-token',
      title: 'Created title',
      message: 'Created message',
      url: 'https://grafana.example.com/alerting',
      urlTitle: 'Open alert',
      device: 'on-call-phone',
      sound: 'siren',
      priority: '2',
      retry: '30s',
      expire: '1h',
      ttl: '5m30s',
      enableHtml: true,
    });
    await expect(pushover.userKeyInput).toHaveAttribute('type', 'password');
    await expect(pushover.tokenInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('pushover-create')).toBeVisible();
    await receiversPage.openReceiverByName('pushover-create');
    await expect(receiversPage.getViewFieldValue('user_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('token')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('Created title');
    await expect(receiversPage.getViewFieldValue('url_title')).toHaveText('Open alert');
    await expect(receiversPage.getViewFieldValue('device')).toHaveText('on-call-phone');
    await expect(receiversPage.getViewFieldValue('sound')).toHaveText('siren');
    await expect(receiversPage.getViewFieldValue('priority')).toHaveText('2');
    await expect(receiversPage.getViewFieldValue('retry')).toHaveText('30s');
    await expect(receiversPage.getViewFieldValue('expire')).toHaveText('1h');
    await expect(receiversPage.getViewFieldValue('ttl')).toHaveText('5m30s');
    await expect(receiversPage.getViewFieldValue('html')).toHaveText('Yes');
  });

  test('updates Pushover without wiping secrets', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(PUSHOVER_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('pushover-update');
    await receiversPage.startEdit();
    const pushover = await receiversPage.selectPushoverIntegration(0);
    await pushover.fill({ title: 'After title', message: 'After message', priority: '2', ttl: '10m' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('pushover-update');
    await expect(receiversPage.getViewFieldValue('user_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('token')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('After title');
    await expect(receiversPage.getViewFieldValue('priority')).toHaveText('2');
    await expect(receiversPage.getViewFieldValue('ttl')).toHaveText('10m');
  });

  test('shows required, priority, and duration validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('pushover-validation');
    const pushover = await receiversPage.selectPushoverIntegration(0);
    await pushover.fill({ priority: '3', ttl: 'tomorrow' });
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('User key is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Token is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Priority must be between -2 and 2', { exact: true })).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Enter a duration such as 30s, 5m30s, or 1.5h', { exact: true })
    ).toBeVisible();
  });
});
