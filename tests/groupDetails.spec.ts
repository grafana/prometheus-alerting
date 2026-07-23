import { expect, test } from './fixtures/ruler';
import { TEST_DATASOURCE_UID, TEST_NAMESPACE } from './factories/rules';

test.describe('Group Details', () => {
  test('shows a read-only Prometheus group and its rules', async ({ groupDetailsPage, page }) => {
    await groupDetailsPage.goto(TEST_DATASOURCE_UID, TEST_NAMESPACE, 'test-group');
    await groupDetailsPage.waitForLoad('test-group');

    await expect(page.getByText(TEST_NAMESPACE, { exact: true })).toBeVisible();
    await expect(groupDetailsPage.ruleItems.filter({ hasText: 'HighErrorRate' })).toBeVisible();
    await expect(groupDetailsPage.ruleItems.filter({ hasText: 'test:request_rate:sum' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
  });

  test('opens the edit form for an editable Mimir group', async ({
    groupDetailsPage,
    groupEditPage,
    mimirRuler,
    page,
  }) => {
    await groupDetailsPage.goto(mimirRuler.uid, mimirRuler.namespace, mimirRuler.groupName);
    await expect(groupDetailsPage.title).toHaveText(mimirRuler.groupName);
    const editLink = groupDetailsPage.getGroupEditLink(
      mimirRuler.uid,
      mimirRuler.namespace,
      mimirRuler.groupName
    );
    const editPath = groupDetailsPage.getEditPath(mimirRuler.uid, mimirRuler.namespace, mimirRuler.groupName);
    await expect(editLink).toBeVisible({ timeout: 30000 });
    await expect(editLink).toHaveAttribute('href', editPath);
    await editLink.click();
    await expect(page).toHaveURL(editPath);
    await expect(groupEditPage.nameInput).toHaveValue(mimirRuler.groupName);
  });
});
