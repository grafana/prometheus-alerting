import { expect, test } from './fixtures/alertmanager';

/**
 * Time intervals e2e (`/time-intervals`).
 *
 * Covers write fidelity: a time interval holds a list of intervals, and each of those holds a
 * list of start/end times. Editing one of them has to leave the rest alone. Each test uses a
 * dedicated Mimir tenant from the `mimirAlertmanager` fixture, so seeded configs don't collide.
 */

const BUSINESS_HOURS_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
  receivers:
    - name: empty-default-receiver
  time_intervals:
    - name: business-hours
      time_intervals:
        - times:
            - start_time: 09:00
              end_time: 12:00
            - start_time: 13:00
              end_time: 17:00
          weekdays: [monday:friday]
          location: Europe/Brussels
        - times:
            - start_time: 10:00
              end_time: 14:00
          weekdays: [saturday, sunday]
`;

test.describe('Time intervals', () => {
  test('shows every interval and time range of an existing time interval', async ({
    timeIntervalsPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(BUSINESS_HOURS_CONFIG);
    await timeIntervalsPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await timeIntervalsPage.openByName('business-hours');

    await expect(timeIntervalsPage.drawer.getByText('09:00–12:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('13:00–17:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('10:00–14:00')).toBeVisible();

    await timeIntervalsPage.editButton.click();

    await expect(timeIntervalsPage.startTimeInput(1)).toHaveValue('09:00');
    await expect(timeIntervalsPage.endTimeInput(1)).toHaveValue('12:00');
    await expect(timeIntervalsPage.startTimeInput(2)).toHaveValue('13:00');
    await expect(timeIntervalsPage.endTimeInput(2)).toHaveValue('17:00');
    await expect(timeIntervalsPage.startTimeInput(1, 2)).toHaveValue('10:00');
  });

  test('editing one time keeps the other intervals and ranges', async ({ timeIntervalsPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(BUSINESS_HOURS_CONFIG);
    await timeIntervalsPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await timeIntervalsPage.openByName('business-hours');
    await timeIntervalsPage.updateStartTime('08:00');

    // The whole interval used to collapse to the single range the form could show
    await timeIntervalsPage.openByName('business-hours');
    await expect(timeIntervalsPage.drawer.getByText('08:00–12:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('13:00–17:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('10:00–14:00')).toBeVisible();
  });

  test('a time range can be added to an existing interval', async ({ timeIntervalsPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(BUSINESS_HOURS_CONFIG);
    await timeIntervalsPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await timeIntervalsPage.openByName('business-hours');
    await timeIntervalsPage.addTimeRange('18:00', '20:00');

    await timeIntervalsPage.openByName('business-hours');
    await expect(timeIntervalsPage.drawer.getByText('09:00–12:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('13:00–17:00')).toBeVisible();
    await expect(timeIntervalsPage.drawer.getByText('18:00–20:00')).toBeVisible();
  });
});
