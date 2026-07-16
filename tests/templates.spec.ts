import { test, expect, VANILLA_ALERTMANAGER_UID, VANILLA_ALERTMANAGER_NAME } from './fixtures/alertmanager';

/**
 * Templates e2e (`/templates`).
 *
 * Vanilla `test-alertmanager` has no seeded templates and no configuration API — used only for
 * the empty-state / hidden-create-button checks. Write tests use a dedicated, fixture-created
 * Mimir tenant (editable). Its initialized config has no templates.
 */

test.describe('Templates', () => {
  test.describe('Vanilla Alertmanager (read-only)', () => {
    test.beforeEach(async ({ templatesPage }) => {
      await templatesPage.gotoWithAlertmanager(VANILLA_ALERTMANAGER_UID);
    });

    test('shows the empty state and hides the create button (no configuration API)', async ({ templatesPage }) => {
      await expect(templatesPage.emptyStateMessage).toBeVisible();
      await expect(templatesPage.createButton).toBeHidden();
    });
  });

  test.describe('Mimir Alertmanager (CRUD)', () => {
    test.beforeEach(async ({ templatesPage, mimirAlertmanager }) => {
      await templatesPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    });

    test('creates a template and shows it in the list', async ({ templatesPage }) => {
      await templatesPage.openCreateDrawer();
      await templatesPage.fillName('new-template.tmpl');
      await templatesPage.fillContent('{{ define "new-template" }}Hello{{ end }}');
      await templatesPage.submitCreate();

      await expect(templatesPage.getRow('new-template.tmpl')).toBeVisible();
      await expect(templatesPage.getRow('new-template.tmpl')).toContainText(
        '{{ define "new-template" }}Hello{{ end }}'
      );
      await templatesPage.expectTemplateCount(1);
    });

    test('views a template in a read-only drawer with Edit/Delete', async ({ templatesPage }) => {
      await templatesPage.openCreateDrawer();
      await templatesPage.fillName('view-me.tmpl');
      await templatesPage.fillContent('{{ define "view-me" }}Content for viewing{{ end }}');
      await templatesPage.submitCreate();
      await expect(templatesPage.getRow('view-me.tmpl')).toBeVisible();

      await templatesPage.openTemplateByName('view-me.tmpl');
      await expect(templatesPage.contentEditor).toBeVisible();
      expect(await templatesPage.getContent()).toContain('Content for viewing');
      await expect(templatesPage.editButton).toBeVisible();
      await expect(templatesPage.deleteButton).toBeVisible();
    });

    test('edits a template', async ({ templatesPage }) => {
      await templatesPage.openCreateDrawer();
      await templatesPage.fillName('edit-me.tmpl');
      await templatesPage.fillContent('{{ define "edit-me" }}Old content{{ end }}');
      await templatesPage.submitCreate();
      await expect(templatesPage.getRow('edit-me.tmpl')).toBeVisible();

      await templatesPage.openTemplateByName('edit-me.tmpl');
      await templatesPage.startEdit();
      await templatesPage.fillName('edited-template.tmpl');
      await templatesPage.fillContent('{{ define "edited-template" }}New content{{ end }}');
      await templatesPage.submitUpdate();

      await expect(templatesPage.getRow('edited-template.tmpl')).toBeVisible();
      await expect(templatesPage.getRow('edit-me.tmpl')).toBeHidden();
      await templatesPage.expectTemplateCount(1);
    });

    test('deletes a template via the confirmation modal', async ({ templatesPage }) => {
      await templatesPage.openCreateDrawer();
      await templatesPage.fillName('delete-me.tmpl');
      await templatesPage.fillContent('{{ define "delete-me" }}Content{{ end }}');
      await templatesPage.submitCreate();
      await expect(templatesPage.getRow('delete-me.tmpl')).toBeVisible();

      await templatesPage.openTemplateByName('delete-me.tmpl');
      await templatesPage.removeViaDrawer();

      await expect(templatesPage.emptyStateMessage).toBeVisible();
    });

    test('switching Alertmanager hides the Mimir template and shows it again on switch-back', async ({
      templatesPage,
      mimirAlertmanager,
    }) => {
      await templatesPage.openCreateDrawer();
      await templatesPage.fillName('switch-test.tmpl');
      await templatesPage.fillContent('{{ define "switch-test" }}Content{{ end }}');
      await templatesPage.submitCreate();
      await expect(templatesPage.getRow('switch-test.tmpl')).toBeVisible();

      await templatesPage.selectAlertmanager(VANILLA_ALERTMANAGER_NAME);
      await expect(templatesPage.emptyStateMessage).toBeVisible();

      await templatesPage.selectAlertmanager(mimirAlertmanager.name);
      await expect(templatesPage.getRow('switch-test.tmpl')).toBeVisible();
    });
  });
});
