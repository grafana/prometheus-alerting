import { expect, test } from './fixtures/alertmanager';

test.describe('Inhibit rules RBAC - no permissions', () => {
  test('a user without notification permissions cannot open the inhibit rules page', async ({
    page,
    inhibitRulesPage,
  }) => {
    await inhibitRulesPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Finhibit-rules/);
  });
});
