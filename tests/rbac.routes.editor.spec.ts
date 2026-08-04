import { expect, test } from './fixtures/alertmanager';

const EDITABLE_ROUTE_CONFIG = `template_files: {}
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

test.describe('Routes RBAC - editor', () => {
  test.beforeEach(async ({ routesListPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(EDITABLE_ROUTE_CONFIG);
    await routesListPage.gotoWithAlertmanager(mimirAlertmanager.uid);
  });

  test('an editor can open add-route forms from root and child routes', async ({ routesListPage }) => {
    await expect(routesListPage.newChildRouteButton).toBeVisible();
    await routesListPage.startAddChildRouteFromRoot();
    await expect(routesListPage.routeDrawer).toBeVisible();
    await routesListPage.cancelButton.click();
    await expect(routesListPage.routeDrawer).toBeHidden();

    const childRoute = routesListPage.getChildRoute(/severity\s*=\s*warning/);
    const addButton = childRoute.getByRole('button', { name: 'Add', exact: true });
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(routesListPage.page.getByRole('menuitem', { name: 'New sibling above', exact: true })).toBeVisible();
    await expect(routesListPage.page.getByRole('menuitem', { name: 'New sibling below', exact: true })).toBeVisible();
    await routesListPage.page.getByRole('menuitem', { name: 'New child route', exact: true }).click();
    await expect(routesListPage.routeDrawer).toBeVisible();
  });

  test('an editor can trigger route editing', async ({ routesListPage }) => {
    const childRoute = routesListPage.getChildRoute(/severity\s*=\s*warning/);

    await routesListPage.openMoreMenu(childRoute, 'Edit');
    await expect(routesListPage.saveButton).toBeVisible();
    await routesListPage.cancelButton.click();
    await expect(routesListPage.routeDrawer).toBeHidden();

    await routesListPage.openRoute(childRoute);
    await expect(routesListPage.editButton).toBeVisible();
    await routesListPage.startEdit();
    await expect(routesListPage.saveButton).toBeVisible();
  });

  test('an editor can trigger route deletion', async ({ routesListPage }) => {
    const childRoute = routesListPage.getChildRoute(/severity\s*=\s*warning/);

    await routesListPage.openMoreMenu(childRoute, 'Delete route');
    await expect(routesListPage.confirmDeleteModal).toBeVisible();
    await routesListPage.confirmDeleteModal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(routesListPage.confirmDeleteModal).toBeHidden();

    await routesListPage.openRoute(childRoute);
    await expect(routesListPage.deleteButton).toBeVisible();
    await routesListPage.deleteButton.click();
    await expect(routesListPage.confirmDeleteModal).toBeVisible();
  });
});
