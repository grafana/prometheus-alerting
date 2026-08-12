import { expect, test } from './fixtures/alertmanager';

test.describe('Templates RBAC - no permissions', () => {
  test('a user without notification permissions cannot open the templates page', async ({ page, templatesPage }) => {
    await templatesPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Ftemplates/);
  });
});
