import { test, expect } from './fixtures/ruler';

test.describe('Rules RBAC - no permissions', () => {
  test('a user without permissions cannot open the rules page', async ({ page, rulesListPage }) => {
    await rulesListPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Frules/);
  });
});
