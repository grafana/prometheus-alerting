import { test, expect } from '../fixtures/alertmanager';

const PAGERDUTY_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: pagerduty-update
  receivers:
    - name: pagerduty-update
      pagerduty_configs:
        - routing_key: 'before-routing-key'
          url: 'https://events.pagerduty.com/v2/enqueue'
          client: 'before-client'
          description: 'Before description'
          severity: 'warning'
          details:
            existing: 'preserve-me'
`;

test.describe('PagerDuty receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a PagerDuty receiver with structured details', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('pagerduty-full-options');
    const pagerDuty = await receiversPage.selectPagerDutyIntegration(0);
    await pagerDuty.fill({
      routingKey: 'routing-key-create',
      url: 'https://events.pagerduty.com/v2/enqueue',
      client: 'Prometheus Alerting',
      clientUrl: 'https://grafana.example.com/alerting',
      description: 'PagerDuty alert description',
      severity: 'critical',
    });
    await pagerDuty.addDetail('environment', 'production');

    // #1940: Details used to be a plain string input, producing a raw Zod error on save.
    await expect(pagerDuty.routingKeyInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();
    await expect(receiversPage.getRow('pagerduty-full-options')).toBeVisible();

    await receiversPage.openReceiverByName('pagerduty-full-options');
    await expect(receiversPage.getViewFieldValue('routing_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('url')).toHaveText('https://events.pagerduty.com/v2/enqueue');
    await expect(receiversPage.getViewFieldValue('client')).toHaveText('Prometheus Alerting');
    await expect(receiversPage.getViewFieldValue('client_url')).toHaveText('https://grafana.example.com/alerting');
    await expect(receiversPage.getViewFieldValue('description')).toHaveText('PagerDuty alert description');
    await expect(receiversPage.getViewFieldValue('severity')).toHaveText('critical');
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('updates a PagerDuty receiver and preserves structured details', async ({
    receiversPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(PAGERDUTY_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await receiversPage.openReceiverByName('pagerduty-update');
    await receiversPage.startEdit();
    const pagerDuty = await receiversPage.selectPagerDutyIntegration(0);
    await pagerDuty.fill({
      routingKey: 'after-routing-key',
      client: 'after-client',
      description: 'After description',
      severity: 'critical',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('pagerduty-update');
    await expect(receiversPage.getViewFieldValue('routing_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.getViewFieldValue('client')).toHaveText('after-client');
    await expect(receiversPage.getViewFieldValue('description')).toHaveText('After description');
    await expect(receiversPage.getViewFieldValue('severity')).toHaveText('critical');
    await expect(receiversPage.drawer.getByText('existing', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('preserve-me', { exact: true })).toBeVisible();
  });

  test('shows cross-field validation for conflicting authentication', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('pagerduty-cross-field-validation');
    const pagerDuty = await receiversPage.selectPagerDutyIntegration(0);
    await pagerDuty.fill({
      routingKey: 'routing-key',
      authorizationCredentials: 'authorization-token',
      basicAuthUsername: 'basic-user',
    });
    await receiversPage.submitCreate();

    // #1941 affected PagerDuty's shared HTTP authentication settings too.
    await expect(
      receiversPage.drawer.getByText('Authorization and basic authentication cannot be used together', {
        exact: true,
      })
    ).toBeVisible();
    await expect(receiversPage.getRow('pagerduty-cross-field-validation')).toBeHidden();
  });
});
