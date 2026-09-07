import { test, expect } from '../fixtures/alertmanager';

const VICTOROPS_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: victorops-update
  receivers:
    - name: victorops-update
      victorops_configs:
        - api_key: 'before-api-key'
          api_url: 'https://alert.victorops.com/integrations/generic/20131114/alert/'
          routing_key: 'before-routing'
          message_type: 'WARNING'
          entity_display_name: 'Before entity'
          state_message: 'Before state'
          monitoring_tool: 'Prometheus'
`;

test.describe('VictorOps receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a VictorOps receiver and masks its API key', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('victorops-create');
    const victorOps = await receiversPage.selectVictorOpsIntegration(0);
    await victorOps.fill({
      apiKey: 'create-api-key',
      apiUrl: 'https://alert.victorops.com/integrations/generic/20131114/alert/',
      routingKey: 'create-routing',
      messageType: 'CRITICAL',
      entityDisplayName: 'Created entity',
      stateMessage: 'Created state',
      monitoringTool: 'Prometheus Alerting',
    });
    await expect(victorOps.apiKeyInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('victorops-create')).toBeVisible();
    await receiversPage.openReceiverByName('victorops-create');
    await expect(receiversPage.getViewFieldValue('api_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('routing_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('message_type')).toHaveText('CRITICAL');
    await expect(receiversPage.getViewFieldValue('entity_display_name')).toHaveText('Created entity');
  });

  test('updates VictorOps without wiping its API key', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(VICTOROPS_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('victorops-update');
    await receiversPage.startEdit();
    const victorOps = await receiversPage.selectVictorOpsIntegration(0);
    await victorOps.fill({
      routingKey: 'after-routing',
      messageType: 'INFO',
      entityDisplayName: 'After entity',
      stateMessage: 'After state',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('victorops-update');
    await expect(receiversPage.getViewFieldValue('api_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('routing_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('message_type')).toHaveText('INFO');
    await expect(receiversPage.getViewFieldValue('entity_display_name')).toHaveText('After entity');
    await expect(receiversPage.getViewFieldValue('state_message')).toHaveText('After state');
  });

  test('shows required and message type validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('victorops-validation');
    const victorOps = await receiversPage.selectVictorOpsIntegration(0);
    await victorOps.fill({ messageType: 'URGENT' });
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('API key is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Routing key is required', { exact: true })).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Message type must be CRITICAL, WARNING, or INFO', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('victorops-validation')).toBeHidden();
  });
});
