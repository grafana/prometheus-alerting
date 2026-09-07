import { test, expect } from '../fixtures/alertmanager';

const DISCORD_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: discord-update
  receivers:
    - name: discord-update
      discord_configs:
        - webhook_url: 'https://discord.example/webhook-before'
          title: 'Before title'
          message: 'Before message'
`;

test.describe('Discord receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Discord receiver and masks its webhook URL', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('discord-create');
    const discord = await receiversPage.selectDiscordIntegration(0);
    await discord.fill({
      webhookUrl: 'https://discord.example/webhook-create',
      title: 'Created title',
      message: 'Created message',
    });
    await expect(discord.webhookUrlInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('discord-create')).toBeVisible();
    await receiversPage.openReceiverByName('discord-create');
    await expect(receiversPage.getViewFieldValue('webhook_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('Created title');
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('Created message');
  });

  test('updates a Discord receiver', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(DISCORD_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('discord-update');
    await receiversPage.startEdit();
    const discord = await receiversPage.selectDiscordIntegration(0);
    await discord.fill({
      webhookUrl: 'https://discord.example/webhook-after',
      title: 'After title',
      message: 'After message',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('discord-update');
    await expect(receiversPage.getViewFieldValue('webhook_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('After title');
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('After message');
  });

  test('shows required and cross-field validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('discord-required');
    await receiversPage.selectDiscordIntegration(0);
    await receiversPage.submitCreate();
    await expect(receiversPage.drawer.getByText('Webhook URL is required', { exact: true })).toBeVisible();

    await receiversPage.cancelButton.click();
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('discord-conflict');
    const discord = await receiversPage.selectDiscordIntegration(0);
    await discord.fill({
      webhookUrl: 'https://discord.example/webhook',
      authorizationCredentials: 'authorization-token',
      basicAuthUsername: 'basic-user',
    });
    await receiversPage.submitCreate();
    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('discord-conflict')).toBeHidden();
  });
});
