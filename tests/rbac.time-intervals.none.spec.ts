import { expect, test } from './fixtures/alertmanager';

test.describe('Time intervals RBAC - no permissions', () => {
  test('a user without notification permissions cannot open the time intervals page', async ({
    page,
    timeIntervalsPage,
  }) => {
    await timeIntervalsPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Ftime-intervals/);
  });
});
