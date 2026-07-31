import { expect, test } from './fixtures/alertmanager';

const READABLE_ROUTE_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
    routes:
      - receiver: empty-default-receiver
        matchers:
          - severity="warning"
  receivers:
    - name: empty-default-receiver
`;

test.describe('Routes RBAC - viewer', () => {
  test('a viewer can inspect routes but cannot access mutation actions', async ({
    routesListPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(READABLE_ROUTE_CONFIG);
    await routesListPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(routesListPage.rootRoute).toBeVisible();
    const childRoute = routesListPage.getChildRoute(/severity\s*=\s*warning/);
    await expect(childRoute).toBeVisible();
    await expect(routesListPage.newChildRouteButton).toHaveCount(0);
    await expect(routesListPage.page.getByRole('button', { name: 'Add', exact: true })).toHaveCount(0);

    await routesListPage.openMoreActions(childRoute);
    await expect(routesListPage.page.getByRole('menuitem', { name: 'Details', exact: true })).toBeVisible();
    await expect(routesListPage.page.getByRole('menuitem', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(routesListPage.page.getByRole('menuitem', { name: 'Delete route', exact: true })).toHaveCount(0);
    await routesListPage.page.getByRole('menuitem', { name: 'Details', exact: true }).click();

    await expect(routesListPage.routeDrawer).toBeVisible();
    await expect(routesListPage.editButton).toBeHidden();
    await expect(routesListPage.deleteButton).toBeHidden();
  });
});
