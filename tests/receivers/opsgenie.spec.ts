import { test, expect } from '../fixtures/alertmanager';

const OPSGENIE_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: opsgenie-update
  receivers:
    - name: opsgenie-update
      opsgenie_configs:
        - api_key: 'before-api-key'
          api_url: 'https://api.opsgenie.com/'
          message: 'Before message'
          description: 'Before description'
          priority: 'P3'
          details:
            existing: 'preserve-me'
`;

test.describe('Opsgenie receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates an Opsgenie receiver with structured details', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('opsgenie-create');
    const opsgenie = await receiversPage.selectOpsgenieIntegration(0);
    await opsgenie.fill({
      apiKey: 'create-api-key',
      apiUrl: 'https://api.opsgenie.com/',
      message: 'Created message',
      description: 'Created description',
      source: 'Prometheus Alerting',
      tags: 'production,alerts',
      note: 'Created note',
      priority: 'P1',
    });
    await opsgenie.addDetail('environment', 'production');
    await expect(opsgenie.apiKeyInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('opsgenie-create')).toBeVisible();
    await receiversPage.openReceiverByName('opsgenie-create');
    await expect(receiversPage.getViewFieldValue('api_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('Created message');
    await expect(receiversPage.getViewFieldValue('description')).toHaveText('Created description');
    await expect(receiversPage.getViewFieldValue('priority')).toHaveText('P1');
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('updates an Opsgenie receiver and preserves details', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(OPSGENIE_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('opsgenie-update');
    await receiversPage.startEdit();
    const opsgenie = await receiversPage.selectOpsgenieIntegration(0);
    await expect(opsgenie.apiKeyInput).toHaveValue('before-api-key');
    await expect(opsgenie.apiKeyInput).toHaveAttribute('type', 'password');
    await opsgenie.fill({ message: 'After message', priority: 'P2' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('opsgenie-update');
    await expect(receiversPage.getViewFieldValue('api_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('message')).toHaveText('After message');
    await expect(receiversPage.getViewFieldValue('priority')).toHaveText('P2');
    await expect(receiversPage.drawer.getByText('existing', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('preserve-me', { exact: true })).toBeVisible();
  });

  test('shows API key and priority validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('opsgenie-validation');
    const opsgenie = await receiversPage.selectOpsgenieIntegration(0);
    await opsgenie.fill({ priority: 'urgent' });
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('API key is required', { exact: true })).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Priority must be P1, P2, P3, P4, or P5', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('opsgenie-validation')).toBeHidden();
  });
});
