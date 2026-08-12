import { expect, test } from './fixtures/alertmanager';

test.describe('Receivers RBAC - no permissions', () => {
  test('a user without notification permissions cannot open the receivers page', async ({ page, receiversPage }) => {
    await receiversPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Freceivers/);
  });
});
