import { test, expect } from '../fixtures/alertmanager';

const SNS_BEFORE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: sns-update
  receivers:
    - name: sns-update
      sns_configs:
        - api_url: 'https://sns.us-east-1.amazonaws.com'
          topic_arn: 'arn:aws:sns:us-east-1:123456789012:before'
          subject: 'Before subject'
          message: 'Before message'
          sigv4:
            region: 'us-east-1'
            access_key: 'before-access-key'
            secret_key: 'before-secret-key'
          attributes:
            environment: 'production'
`;

test.describe('Amazon SNS receiver', () => {
  test.beforeEach(async ({ receiversPage, mimirAlertmanager }) => {
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('creates an SNS receiver with SigV4 and attributes', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('sns-create');
    const sns = await receiversPage.selectSNSIntegration(0);
    await sns.fill({
      apiUrl: 'https://sns.us-east-1.amazonaws.com',
      region: 'us-east-1',
      accessKey: 'create-access-key',
      secretKey: 'create-secret-key',
      roleArn: 'arn:aws:iam::123456789012:role/Alertmanager',
      topicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
      subject: 'Created subject',
      message: 'Created message',
    });
    await sns.addAttribute('environment', 'production');
    await expect(sns.secretKeyInput).toHaveAttribute('type', 'password');
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow('sns-create')).toBeVisible();
    await receiversPage.openReceiverByName('sns-create');
    await expect(receiversPage.getViewFieldValue('topic_arn')).toHaveText('arn:aws:sns:us-east-1:123456789012:alerts');
    await expect(receiversPage.getViewFieldValue('region')).toHaveText('us-east-1');
    await expect(receiversPage.getViewFieldValue('secret_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('updates SNS without wiping SigV4 credentials or attributes', async ({ receiversPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(SNS_BEFORE_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openReceiverByName('sns-update');
    await receiversPage.startEdit();
    const sns = await receiversPage.selectSNSIntegration(0);
    await sns.fill({
      topicArn: 'arn:aws:sns:us-east-1:123456789012:after',
      subject: 'After subject',
      message: 'After message',
    });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName('sns-update');
    await expect(receiversPage.getViewFieldValue('topic_arn')).toHaveText('arn:aws:sns:us-east-1:123456789012:after');
    await expect(receiversPage.getViewFieldValue('access_key')).toHaveText('before-access-key');
    await expect(receiversPage.getViewFieldValue('secret_key')).toHaveText(/^\*+$/);
    await expect(receiversPage.drawer.getByText('environment', { exact: true })).toBeVisible();
    await expect(receiversPage.drawer.getByText('production', { exact: true })).toBeVisible();
  });

  test('validates a destination and paired SigV4 keys', async ({ receiversPage }) => {
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName('sns-validation');
    const sns = await receiversPage.selectSNSIntegration(0);
    await sns.fill({ accessKey: 'access-without-secret' });
    await receiversPage.submitCreate();

    await expect(
      receiversPage.drawer.getByText('Topic ARN, phone number, or target ARN is required', { exact: true })
    ).toBeVisible();
    await expect(
      receiversPage.drawer.getByText('Access key and secret key must be supplied together', { exact: true })
    ).toBeVisible();
    await expect(receiversPage.getRow('sns-validation')).toBeHidden();
  });
});
