import { test, expect } from '../fixtures/alertmanager';

const MSTEAMS_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: msteams-update
  receivers:
    - name: msteams-update
      msteams_configs:
        - webhook_url: 'https://teams.example/webhook-before'
          title: 'Before title'
          summary: 'Before summary'
          text: 'Before text'
`;

test.describe('Microsoft Teams receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Microsoft Teams receiver and masks its webhook URL', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('msteams-create');
    const teams = await receiversPage.selectMSTeamsIntegration(0);
    await teams.fill({
      webhookUrl: 'https://teams.example/webhook-create',
      title: 'Created title',
      summary: 'Created summary',
      text: 'Created text',
      proxyUrl: 'http://proxy.teams.example.com:8080',
      tlsServerName: 'teams.example.com',
    });
    await expect(teams.webhookUrlInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('msteams-create')).toBeVisible();
    await receiversPage.openReceiverByName('msteams-create');
    await expect(receiversPage.getViewFieldValue('webhook_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('Created title');
    await expect(receiversPage.getViewFieldValue('summary')).toHaveText('Created summary');
    await expect(receiversPage.getViewFieldValue('text')).toHaveText('Created text');
    await expect(receiversPage.getViewFieldValue('proxy_url')).toHaveText('http://proxy.teams.example.com:8080');
    await expect(receiversPage.getViewFieldValue('server_name')).toHaveText('teams.example.com');
  });

  test('updates a Microsoft Teams receiver', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(MSTEAMS_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('msteams-update');
    await receiversPage.startEdit();
    const teams = await receiversPage.selectMSTeamsIntegration(0);
    await teams.fill({
      webhookUrl: 'https://teams.example/webhook-after',
      title: 'After title',
      summary: 'After summary',
      text: 'After text',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('msteams-update');
    await expect(receiversPage.getViewFieldValue('webhook_url')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('title')).toHaveText('After title');
    await expect(receiversPage.getViewFieldValue('summary')).toHaveText('After summary');
    await expect(receiversPage.getViewFieldValue('text')).toHaveText('After text');
  });

  test('shows required and cross-field validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('msteams-required');
    await receiversPage.selectMSTeamsIntegration(0);
    await receiversPage.submitCreate();
    await expect(receiversPage.drawer.getByText('Webhook URL is required', { exact: true })).toBeVisible();

    await receiversPage.cancelButton.click();
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('msteams-conflict');
    const teams = await receiversPage.selectMSTeamsIntegration(0);
    await teams.fill({
      webhookUrl: 'https://teams.example/webhook',
      authorizationCredentials: 'authorization-token',
      basicAuthUsername: 'basic-user',
    });
    await receiversPage.submitCreate();
    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('msteams-conflict')).toBeHidden();
  });
});
