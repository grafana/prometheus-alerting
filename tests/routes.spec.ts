import { test, expect, VANILLA_ALERTMANAGER_UID } from './fixtures/alertmanager';

/**
 * Routes / notification tree e2e (`/routes`).
 *
 * Read tests use the vanilla `test-alertmanager` (root + 5 seeded child routes in
 * test-data/alertmanager/alertmanager.yml, read-only). Write tests use a fixture-created Mimir
 * Alertmanager tenant, initialized with a root route whose receiver is `empty-default-receiver`
 * and which has zero child routes.
 */

/**
 * The route card renders matchers unquoted (e.g. "severity=critical"), but the drawer runs them
 * through `computeInheritedTree` first, which renders them quoted (e.g. `severity="critical"`).
 * Use this for drawer-scoped assertions; card-scoped ones can match the label/value directly.
 */
function drawerMatcherText(label: string, value: string): RegExp {
  return new RegExp(`${label}\\s*=\\s*"?${value}"?`);
}

test.describe('Routes', () => {
  test.describe('Vanilla Alertmanager (read-only)', () => {
    test.beforeEach(async ({ routesListPage }) => {
      await routesListPage.gotoWithAlertmanager(VANILLA_ALERTMANAGER_UID);
    });

    test('shows the root route with its receiver', async ({ routesListPage }) => {
      await expect(routesListPage.rootRoute).toBeVisible();
      await expect(routesListPage.rootRoute.getByRole('heading', { name: 'Default route' })).toBeVisible();
      await expect(routesListPage.rootRoute.getByTestId('receiver')).toContainText('default');
    });

    test('shows the seeded child routes with their matchers and receivers', async ({ routesListPage }) => {
      await expect(routesListPage.childRoutes).toHaveCount(5);
      await expect(routesListPage.getChildRoute(/severity\s*=\s*critical/)).toHaveCount(2);
      await expect(routesListPage.getChildRoute(/team\s*=\s*platform/)).toHaveCount(2);
      await expect(routesListPage.getChildRoute(/team\s*=\s*ops/)).toHaveCount(1);

      await expect(routesListPage.getChildRoute('pagerduty')).toBeVisible();
      await expect(routesListPage.getChildRoute('slack-critical')).toBeVisible();
      await expect(routesListPage.getChildRoute('slack-platform')).toBeVisible();
      await expect(routesListPage.getChildRoute('email-platform')).toBeVisible();
      await expect(routesListPage.getChildRoute('mixed')).toBeVisible();
    });

    test('does not offer to add routes (no configuration API)', async ({ routesListPage }) => {
      await expect(routesListPage.newChildRouteButton).toHaveCount(0);
      await expect(routesListPage.page.getByRole('button', { name: 'Add', exact: true })).toHaveCount(0);
    });

    test('opens a read-only drawer showing matchers and receiver', async ({ routesListPage }) => {
      // 'severity=critical' matches two routes (pagerduty, slack-critical); disambiguate by receiver.
      await routesListPage.openChildRoute('pagerduty');

      // The matcher label is rendered twice (a visible span plus a title-attributed wrapper for
      // truncation tooltips) — `.first()` avoids a strict-mode violation on the duplicate match.
      await expect(
        routesListPage.routeDrawer.getByText(drawerMatcherText('severity', 'critical')).first()
      ).toBeVisible();
      await expect(routesListPage.routeDrawer.getByRole('link', { name: 'pagerduty' })).toBeVisible();

      // Read-only Alertmanagers expose no Edit/Delete footer.
      await expect(routesListPage.editButton).toBeHidden();
      await expect(routesListPage.deleteButton).toBeHidden();
    });

    test('clicking the receiver link opens a receiver drawer with a way back to the route', async ({
      routesListPage,
    }) => {
      await routesListPage.openChildRoute('pagerduty');
      await routesListPage.openReceiverLink('pagerduty');

      await expect(routesListPage.receiverDrawer).toBeVisible();
      await expect(routesListPage.receiverDrawer.getByText('pagerduty', { exact: true }).first()).toBeVisible();
      // Opening the receiver drawer replaces the route drawer (it unmounts, not just hides);
      // "Back to route" is the only way back, and it restores the same route drawer.
      await expect(routesListPage.routeDrawer).toBeHidden();

      await routesListPage.goBackToRoute();
      await expect(routesListPage.receiverDrawer).toBeHidden();
      await expect(routesListPage.routeDrawer).toBeVisible();
    });
  });

  test.describe('Mimir Alertmanager (CRUD)', () => {
    test.beforeEach(async ({ routesListPage, mimirAlertmanager }) => {
      await routesListPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    });

    test('adds a child route from the root', async ({ routesListPage }) => {
      await routesListPage.startAddChildRouteFromRoot();
      await routesListPage.addMatcher({ label: 'severity', value: 'warning' });
      await routesListPage.selectReceiver('empty-default-receiver');
      await routesListPage.submitSave();

      await expect(routesListPage.routeDrawer).toBeHidden();
      await expect(routesListPage.getChildRoute(/severity\s*=\s*warning/)).toBeVisible();
    });

    test('edits a route', async ({ routesListPage }) => {
      await routesListPage.startAddChildRouteFromRoot();
      await routesListPage.addMatcher({ label: 'severity', value: 'warning' });
      await routesListPage.selectReceiver('empty-default-receiver');
      await routesListPage.submitSave();
      await expect(routesListPage.getChildRoute(/severity\s*=\s*warning/)).toBeVisible();

      await routesListPage.openChildRoute(/severity\s*=\s*warning/);
      await routesListPage.startEdit();
      await routesListPage.matcherValueInput(0).fill('critical');
      await routesListPage.submitSave();

      // A successful edit closes the drawer automatically (RouteDrawer.handleSave calls
      // onClose()), so just wait for it to disappear before asserting the refreshed card.
      await expect(routesListPage.routeDrawer).toBeHidden();
      await expect(routesListPage.getChildRoute(/severity\s*=\s*critical/)).toBeVisible();
      await expect(routesListPage.getChildRoute(/severity\s*=\s*warning/)).toHaveCount(0);

      await routesListPage.openChildRoute(/severity\s*=\s*critical/);
      await expect(
        routesListPage.routeDrawer.getByText(drawerMatcherText('severity', 'critical')).first()
      ).toBeVisible();
    });

    /**
     * Regression test for durations being rejected in the browser build. The duration fields only
     * render while "Override general timings" is on, so every other route test saves without ever
     * running the validator — which is how a validator that rejected *every* duration shipped
     * green. Unit tests can't cover this: they don't compile down to the target that breaks it.
     */
    test('saves a route with timings', async ({ routesListPage }) => {
      await routesListPage.startAddChildRouteFromRoot();
      await routesListPage.addMatcher({ label: 'severity', value: 'warning' });
      await routesListPage.selectReceiver('empty-default-receiver');
      await routesListPage.setTimings({ groupWait: '10s', groupInterval: '1m', repeatInterval: '1h' });
      await routesListPage.submitSave();

      await expect(routesListPage.routeDrawer).toBeHidden();
      const route = routesListPage.getChildRoute(/severity\s*=\s*warning/);
      await expect(route).toBeVisible();

      // ...and they survive a round trip through the Alertmanager configuration.
      await routesListPage.openChildRoute(/severity\s*=\s*warning/);
      await routesListPage.startEdit();
      await expect(routesListPage.groupWaitInput).toHaveValue('10s');
      await expect(routesListPage.groupIntervalInput).toHaveValue('1m');
      await expect(routesListPage.repeatIntervalInput).toHaveValue('1h');

      // Re-saving an untouched form must not be rejected either.
      await routesListPage.submitSave();
      await expect(routesListPage.routeDrawer).toBeHidden();
    });

    test('deletes a route via the card menu', async ({ routesListPage }) => {
      await routesListPage.startAddChildRouteFromRoot();
      await routesListPage.addMatcher({ label: 'severity', value: 'warning' });
      await routesListPage.selectReceiver('empty-default-receiver');
      await routesListPage.submitSave();
      const route = routesListPage.getChildRoute(/severity\s*=\s*warning/);
      await expect(route).toBeVisible();

      await routesListPage.deleteViaCardMenu(route);

      await expect(routesListPage.getChildRoute(/severity\s*=\s*warning/)).toHaveCount(0);
    });
  });
});
