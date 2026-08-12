import { expect, test } from './fixtures/alertmanager';

const READABLE_TIME_INTERVAL_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
  receivers:
    - name: empty-default-receiver
  time_intervals:
    - name: rbac-viewer-interval
      time_intervals:
        - times:
            - start_time: 09:00
              end_time: 17:00
`;

test.describe('Time intervals RBAC - viewer', () => {
  test('a viewer can inspect intervals but cannot access mutation actions or the create form', async ({
    timeIntervalsPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(READABLE_TIME_INTERVAL_CONFIG);
    await timeIntervalsPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(timeIntervalsPage.getRow('rbac-viewer-interval')).toBeVisible();
    await expect(timeIntervalsPage.createLink).toHaveCount(0);
    await timeIntervalsPage.openByName('rbac-viewer-interval');
    await expect(timeIntervalsPage.drawer.getByText('09:00 - 17:00')).toBeVisible();
    await expect(timeIntervalsPage.editButton).toHaveCount(0);
    await expect(timeIntervalsPage.removeButton).toHaveCount(0);

    await timeIntervalsPage.gotoCreate();
    await expect(timeIntervalsPage.permissionDeniedAlert).toContainText(
      'You do not have the required permissions to access this page.'
    );
    await expect(timeIntervalsPage.nameInput).toHaveCount(0);
  });
});
