import { expect, test } from './fixtures/alertmanager';

test.describe('Routes RBAC - editor', () => {
  test('an editor can add a route to a configurable Alertmanager', async ({ routesListPage, mimirAlertmanager }) => {
    await routesListPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await routesListPage.startAddChildRouteFromRoot();
    await routesListPage.addMatcher({ label: 'severity', value: 'warning' });
    await routesListPage.selectReceiver('empty-default-receiver');
    await routesListPage.submitSave();

    await expect(routesListPage.routeDrawer).toBeHidden();
    await expect(routesListPage.getChildRoute(/severity\s*=\s*warning/)).toBeVisible();
  });
});
