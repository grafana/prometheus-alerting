import { test, expect } from '../fixtures/alertmanager';

const JIRA_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: jira-update
  receivers:
    - name: jira-update
      jira_configs:
        - api_url: 'https://jira.example.com'
          project: 'OPS'
          issue_type: 'Incident'
          summary: 'Before summary'
          description: 'Before description'
          labels: ['alerts', 'before']
          priority: 'High'
          reopen_duration: '5m'
          fields:
            environment: 'production'
`;

test.describe('Jira receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates a Jira receiver with labels and custom fields', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('jira-create');
    const jira = await receiversPage.selectJiraIntegration(0);
    await jira.fill({
      apiUrl: 'https://jira.example.com',
      project: 'OPS',
      issueType: 'Incident',
      summary: 'Created summary',
      description: 'Created description',
      labels: 'alerts, production',
      priority: 'Highest',
      reopenDuration: '5m30s',
    });
    await jira.addField('environment', 'production');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('jira-create')).toBeVisible();
    await receiversPage.openReceiverByName('jira-create');
    await expect(receiversPage.getViewFieldValue('project')).toHaveText('OPS');
    await expect(receiversPage.getViewFieldValue('issue_type')).toHaveText('Incident');
    await expect(receiversPage.getViewFieldValue('summary')).toHaveText('Created summary');
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('updates Jira and preserves structured fields', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(JIRA_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('jira-update');
    await receiversPage.startEdit();
    const jira = await receiversPage.selectJiraIntegration(0);
    await jira.fill({ summary: 'After summary', description: 'After description', labels: 'alerts, after' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('jira-update');
    await expect(receiversPage.getViewFieldValue('summary')).toHaveText('After summary');
    await expect(receiversPage.getViewFieldValue('description')).toHaveText('After description');
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('shows required and duration validation errors', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('jira-validation');
    const jira = await receiversPage.selectJiraIntegration(0);
    await jira.fill({ reopenDuration: 'tomorrow' });
    await receiversPage.submitCreate();

    await expect(receiversPage.drawer.getByText('API URL is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Project key is required', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('Issue type is required', { exact: true })).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Enter a duration such as 100ms, 1.2s, or 8h', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('jira-validation')).toBeHidden();
  });
});
