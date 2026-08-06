import { expect, test } from './fixtures/alertmanager';

test.describe('Silences RBAC - no permissions', () => {
  test('a user without instance permissions cannot open the silences page', async ({ page, silencesPage }) => {
    await silencesPage.goto();

    await expect(page).toHaveURL(/\/\?redirectTo=.*%2Fsilences/);
  });
});
