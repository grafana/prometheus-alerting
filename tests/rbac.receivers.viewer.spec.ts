import { expect, test } from './fixtures/alertmanager';

const READABLE_RECEIVER_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: rbac-viewer-receiver
  receivers:
    - name: rbac-viewer-receiver
      webhook_configs:
        - url: http://example.com/viewer-webhook
`;

test.describe('Receivers RBAC - viewer', () => {
  test('a viewer can inspect receivers but cannot access mutation actions', async ({
    receiversPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(READABLE_RECEIVER_CONFIG);
    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(receiversPage.getRow('rbac-viewer-receiver')).toBeVisible();
    await expect(receiversPage.createButton).toHaveCount(0);

    await receiversPage.openReceiverByName('rbac-viewer-receiver');
    await expect(receiversPage.drawer.getByText('http://example.com/viewer-webhook')).toBeVisible();
    await expect(receiversPage.editButton).toHaveCount(0);
    await expect(receiversPage.deleteButton).toHaveCount(0);
  });
});
