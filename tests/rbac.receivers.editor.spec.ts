import { expect, test } from './fixtures/alertmanager';

test.describe('Receivers RBAC - editor', () => {
  test('an editor can create, edit, and delete a receiver', async ({ receiversPage, mimirAlertmanager }) => {
    const receiverName = `rbac-editor-${mimirAlertmanager.tenantId.slice(-12)}`;

    await receiversPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await receiversPage.openCreateDrawer();
    await receiversPage.fillName(receiverName);
    const webhook = await receiversPage.selectWebhookIntegration(0);
    await webhook.fill({ url: 'http://example.com/rbac-before' });
    await receiversPage.submitCreate();

    await expect(receiversPage.getRow(receiverName)).toBeVisible();
    await receiversPage.openReceiverByName(receiverName);
    await receiversPage.startEdit();
    const editedWebhook = await receiversPage.selectWebhookIntegration(0);
    await editedWebhook.fill({ url: 'http://example.com/rbac-after' });
    await receiversPage.submitUpdate();

    await receiversPage.openReceiverByName(receiverName);
    await expect(receiversPage.drawer.getByText('http://example.com/rbac-after')).toBeVisible();
    await receiversPage.removeViaDrawer();

    await expect(receiversPage.getRow(receiverName)).toHaveCount(0);
  });
});
