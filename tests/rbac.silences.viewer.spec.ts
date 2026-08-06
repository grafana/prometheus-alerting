import { expect, test } from './fixtures/alertmanager';
import { seedMimirSilence } from './api/silences';

test.describe('Silences RBAC - viewer', () => {
  test('a viewer can inspect silences but cannot access mutation actions', async ({
    silencesPage,
    mimirAlertmanager,
  }) => {
    await seedMimirSilence(mimirAlertmanager.tenantId, {
      matcherName: 'alertname',
      matcherValue: 'ViewerVisibleAlert',
      comment: 'seeded for the viewer RBAC spec',
    });
    await silencesPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(silencesPage.rows).toHaveCount(1);
    await expect(silencesPage.createButton).toHaveCount(0);

    await silencesPage.openSilenceByText(/ViewerVisibleAlert/);
    await expect(silencesPage.editButton).toHaveCount(0);
    await expect(silencesPage.recreateButton).toHaveCount(0);
    await expect(silencesPage.expireButton).toHaveCount(0);
  });

  test('a viewer is denied the create silence page', async ({ page, silencesPage, mimirAlertmanager }) => {
    await silencesPage.gotoCreateWithAlertmanager(mimirAlertmanager.uid);

    await expect(page.getByRole('alert').filter({ hasText: 'Permission denied' })).toBeVisible();
    await expect(silencesPage.submitButton).toHaveCount(0);
  });
});
