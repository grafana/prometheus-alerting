import { expect, test } from './fixtures/alertmanager';
import { seedMimirSilence } from './api/silences';

test.describe('Silences RBAC - editor', () => {
  test('an editor can reach the create silence form', async ({ silencesPage, mimirAlertmanager }) => {
    await silencesPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(silencesPage.createButton).toBeVisible();
    await silencesPage.createButton.click();

    await expect(silencesPage.commentInput).toBeVisible();
    await expect(silencesPage.submitButton).toBeVisible();
  });

  test('an editor can trigger editing, recreating and expiring a silence', async ({
    silencesPage,
    mimirAlertmanager,
  }) => {
    await seedMimirSilence(mimirAlertmanager.tenantId, {
      matcherName: 'alertname',
      matcherValue: 'EditorMutableAlert',
      comment: 'seeded for the editor RBAC spec',
    });
    await silencesPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await silencesPage.openSilenceByText(/EditorMutableAlert/);
    await expect(silencesPage.editButton).toBeVisible();
    await expect(silencesPage.recreateButton).toBeVisible();

    await silencesPage.expireButton.click();
    await expect(silencesPage.confirmExpireModal).toBeVisible();
    await silencesPage.confirmExpireModal.getByRole('button', { name: 'Expire', exact: true }).click();

    await expect(silencesPage.confirmExpireModal).toBeHidden();
    await expect(silencesPage.drawer).toBeHidden();
  });
});
