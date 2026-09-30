import { test, expect } from '../fixtures/alertmanager';

const TELEGRAM_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: telegram-update
  receivers:
    - name: telegram-update
      telegram_configs:
        - api_url: 'https://api.telegram.org'
          bot_token: 'before-bot-token'
          chat_id: 123456
          message: 'Before message'
          disable_notifications: true
          parse_mode: 'Markdown'
`;

test.describe('Telegram receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Telegram receiver with its declared default and secret masking', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('telegram-create');
    const telegram = await receiversPage.selectTelegramIntegration(0);
    await expect(receiversPage.drawer.getByLabel('Message thread ID', { exact: true })).toHaveCount(0);
    await expect(telegram.parseModeCombobox).toHaveValue('None');
    await telegram.fill({
      apiUrl: 'https://api.telegram.org',
      botToken: 'create-bot-token',
      chatId: '123456',
      message: 'Created message',
      disableNotifications: true,
      parseMode: 'HTML',
    });
    await expect(telegram.botTokenInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('telegram-create')).toBeVisible();
    await receiversPage.openReceiverByName('telegram-create');
    await expect(receiversPage.getViewFieldValue('bot_token')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('chat_id')).toHaveText('123456');
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('Created message');
    await expect(receiversPage.getViewFieldValue('disable_notifications')).toHaveText('Yes');
    await expect(receiversPage.getViewFieldValue('parse_mode')).toHaveText('HTML');
  });

  test('updates Telegram without wiping its bot token', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(TELEGRAM_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('telegram-update');
    await receiversPage.startEdit();
    const telegram = await receiversPage.selectTelegramIntegration(0);
    await telegram.fill({ chatId: '654321', message: 'After message', parseMode: 'MarkdownV2' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('telegram-update');
    await expect(receiversPage.getViewFieldValue('bot_token')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('chat_id')).toHaveText('654321');
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('After message');
    await expect(receiversPage.getViewFieldValue('disable_notifications')).toHaveText('Yes');
    await expect(receiversPage.getViewFieldValue('parse_mode')).toHaveText('MarkdownV2');
  });

  test('shows required and safe-range validation for Telegram identifiers', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('telegram-required');
    await receiversPage.selectTelegramIntegration(0);
    await receiversPage.submitCreate();
    await expect(receiversPage.drawer.getByText('Bot token is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Chat ID is required', { exact: true })).toBeVisible();

    await receiversPage.cancelButton.click();
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('telegram-range');
    const telegram = await receiversPage.selectTelegramIntegration(0);
    await telegram.fill({ botToken: 'bot-token', chatId: '100000000000000000000' });
    await receiversPage.submitCreate();
    await expect(
      receiversPage.drawer.getByText('Enter an integer within the supported safe range', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('telegram-range')).toBeHidden();
  });
});
