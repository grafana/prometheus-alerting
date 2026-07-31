import { expect, test } from './fixtures/alertmanager';

test.describe('Routes RBAC - no permissions', () => {
  test('a user without notification permissions cannot open the routes page', async ({ page, routesListPage }) => {
    await routesListPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Froutes/);
  });
});
