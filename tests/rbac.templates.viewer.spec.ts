import { expect, test } from './fixtures/alertmanager';

const READABLE_TEMPLATE_CONFIG = `template_files:
  rbac-viewer.tmpl: |
    {{ define "rbac-viewer" }}Viewer content{{ end }}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
  receivers:
    - name: empty-default-receiver
  templates:
    - rbac-viewer.tmpl
`;

test.describe('Templates RBAC - viewer', () => {
  test('a viewer can inspect templates but cannot access mutation actions', async ({
    templatesPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(READABLE_TEMPLATE_CONFIG);
    await templatesPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    await expect(templatesPage.getRow('rbac-viewer.tmpl')).toBeVisible();
    await expect(templatesPage.createButton).toHaveCount(0);

    await templatesPage.openTemplateByName('rbac-viewer.tmpl');
    expect(await templatesPage.getContent()).toContain('Viewer content');
    await expect(templatesPage.editButton).toHaveCount(0);
    await expect(templatesPage.deleteButton).toHaveCount(0);
  });
});
