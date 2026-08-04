import { expect, test } from './fixtures/alertmanager';

test.describe('Time intervals RBAC - editor', () => {
  test('an editor can create, edit, and delete a time interval', async ({ timeIntervalsPage, mimirAlertmanager }) => {
    const intervalName = `rbac-editor-${mimirAlertmanager.tenantId.slice(-12)}`;

    await timeIntervalsPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await timeIntervalsPage.openCreateForm();
    await timeIntervalsPage.create(intervalName, '09:00', '17:00');

    await timeIntervalsPage.openByName(intervalName);
    await timeIntervalsPage.updateStartTime('10:00');
    await timeIntervalsPage.openByName(intervalName);
    await expect(timeIntervalsPage.drawer.getByText('10:00 - 17:00')).toBeVisible();
    await timeIntervalsPage.remove();

    await expect(timeIntervalsPage.getRow(intervalName)).toHaveCount(0);
  });
});
