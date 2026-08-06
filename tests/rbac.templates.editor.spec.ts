import { expect, test } from './fixtures/alertmanager';

test.describe('Templates RBAC - editor', () => {
  test('an editor can create, edit, and delete a template', async ({ templatesPage, mimirAlertmanager }) => {
    const suffix = mimirAlertmanager.tenantId.slice(-12);
    const templateName = `rbac-editor-${suffix}.tmpl`;
    const editedTemplateName = `rbac-editor-updated-${suffix}.tmpl`;

    await templatesPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await templatesPage.openCreateDrawer();
    await templatesPage.fillName(templateName);
    await templatesPage.fillContent('{{ define "rbac-editor" }}Before{{ end }}');
    await templatesPage.submitCreate();

    await expect(templatesPage.getRow(templateName)).toBeVisible();
    await templatesPage.openTemplateByName(templateName);
    await templatesPage.startEdit();
    await templatesPage.fillName(editedTemplateName);
    await templatesPage.fillContent('{{ define "rbac-editor" }}After{{ end }}');
    await templatesPage.submitUpdate();
    await expect(templatesPage.drawer).toBeHidden();

    await templatesPage.page.reload();
    await templatesPage.waitForLoad();
    await expect(templatesPage.getRow(templateName)).toHaveCount(0);
    await templatesPage.openTemplateByName(editedTemplateName);
    expect(await templatesPage.getContent()).toContain('After');
    await templatesPage.removeViaDrawer();

    await expect(templatesPage.getRow(editedTemplateName)).toHaveCount(0);
  });
});
