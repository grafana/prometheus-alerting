import { test, expect } from '../fixtures/alertmanager';

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

test.describe('Slack receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Slack receiver with optional fields and a masked webhook URL', async ({ receiversPage }) => {
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

    await expect(slack.apiUrlInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();
    await expect(receiversPage.getRow('slack-full-options')).toBeVisible();

    await receiversPage.openReceiverByName('slack-full-options');
    await expect(receiversPage.getViewFieldValue('api_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('api_url')).not.toContainText('TOKENTOKEN');
    await expect(receiversPage.getViewFieldValue('channel')).toHaveText('#alerts');
    await expect(receiversPage.getViewFieldValue('icon_emoji')).toHaveText(':bell:');
    await expect(receiversPage.getViewFieldValue('icon_url')).toHaveText('https://example.com/icon.png');
    await expect(receiversPage.getViewFieldValue('username')).toHaveText('Alertmanager');
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('Full title');
    await expect(receiversPage.getViewFieldValue('text')).toHaveText('Full message body');
  });

  test('updates a Slack receiver and persists changed fields', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(SLACK_FULL_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await receiversPage.openReceiverByName('slack-full-update');
    await receiversPage.startEdit();
    const slack = await receiversPage.selectSlackIntegration(0);
    await slack.fill({
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
    await expect(receiversPage.getViewFieldValue('api_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('channel')).toHaveText('#after-channel');
    await expect(receiversPage.getViewFieldValue('icon_emoji')).toHaveText(':white_check_mark:');
    await expect(receiversPage.getViewFieldValue('icon_url')).toHaveText('https://example.com/after-icon.png');
    await expect(receiversPage.getViewFieldValue('username')).toHaveText('after-bot');
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('After title');
    await expect(receiversPage.getViewFieldValue('text')).toHaveText('After message body');
  });

  test('shows channel validation instead of silently blocking create', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('slack-required-validation');
    const slack = await receiversPage.selectSlackIntegration(0);
    await slack.fill({ apiUrl: 'https://hooks.slack.com/services/TEAM/BOT/TOKEN' });
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('Channel is required', { exact: true })).toBeVisible();
    await expect(receiversPage.getRow('slack-required-validation')).toBeHidden();
  });

  test('shows cross-field validation for conflicting HTTP settings', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('slack-cross-field-validation');
    const slack = await receiversPage.selectSlackIntegration(0);
    await slack.fill({
      apiUrl: 'https://hooks.slack.com/services/TEAM/BOT/TOKEN',
      channel: '#alerts',
      authorizationCredentials: 'authorization-token',
      basicAuthUsername: 'basic-user',
      proxyUrl: 'http://proxy.example.com:8080',
      proxyFromEnvironment: true,
    });
    await receiversPage.submitCreate();

    // #1941 affected every integration sharing HTTP configuration, including Slack.
    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Proxy URL and proxy from environment cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('slack-cross-field-validation')).toBeHidden();
  });
});
