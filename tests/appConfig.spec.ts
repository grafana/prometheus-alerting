import { parse as parseYaml } from 'yaml';

import { getMimirAlertmanagerConfig } from './api/alertmanagerConfig';
import { VANILLA_ALERTMANAGER_UID, expect, test } from './fixtures/alertmanager';

const TEMPLATE = '{{ define "alert.title" }}[{{ .Status }}] {{ .CommonLabels.alertname }}{{ end }}\n';

/**
 * A configuration with a comment, a quoted URL and a template file, so the tests can tell whether
 * the plugin passed the document through or reformatted it on the way past.
 */
const seededConfiguration = `# Alerts for the platform team.
route:
  receiver: seeded-receiver
receivers:
  - name: seeded-receiver
    webhook_configs:
      - url: 'http://localhost:9999/webhook'
`;

const seededDocument = `template_files:
  default.tmpl: |
    ${TEMPLATE.trimEnd()}
alertmanager_config: |
${seededConfiguration
  .trimEnd()
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
`;

test.describe('Alertmanager configuration', () => {
  test('shows the stored configuration exactly as Mimir has it', async ({ appConfigPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(seededDocument);

    await appConfigPage.gotoWithAlertmanager(mimirAlertmanager.uid);

    // Comments and quoting survive, which is the whole reason the editor reads the raw document.
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);

    // The warning and its acknowledgement are up before anything is typed, not only once Save is
    // clicked, and the editor will not take an edit until it is acknowledged.
    await expect(appConfigPage.acknowledgeLabel).toBeVisible();
    await expect(appConfigPage.acknowledgeCheckbox).not.toBeChecked();

    // Typing lands nowhere until the consequences are acknowledged.
    await appConfigPage.typeWithoutAcknowledging('# should not appear');
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);
    await expect(appConfigPage.saveButton).toBeDisabled();

    await appConfigPage.acknowledgeWarning();
    await appConfigPage.typeIntoConfiguration('# now it does');

    await expect.poll(() => appConfigPage.getConfiguration()).toContain('# now it does');
    await expect(appConfigPage.saveButton).toBeEnabled();
  });

  test('replaces the configuration and leaves the template files alone', async ({
    appConfigPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(seededDocument);
    await appConfigPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);

    // A global block is the escape hatch this feature exists for: no form models it.
    const updated = `global:
  smtp_from: 'alertmanager@example.com'
  smtp_smarthost: 'smtp.example.com:587'
route:
  receiver: seeded-receiver
receivers:
  - name: seeded-receiver
    webhook_configs:
      - url: 'http://localhost:9999/webhook'
`;

    await appConfigPage.fillConfiguration(updated);
    await appConfigPage.saveAndConfirm();

    await expect(appConfigPage.saveSuccessNotification).toBeVisible();

    await expect
      .poll(async () => parseYaml(await getMimirAlertmanagerConfig(mimirAlertmanager.tenantId)))
      .toEqual({
        template_files: { 'default.tmpl': TEMPLATE },
        alertmanager_config: updated,
      });
  });

  test('reacts to typing without waiting for focus to leave the editor', async ({
    appConfigPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(seededDocument);
    await appConfigPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);

    await expect(appConfigPage.saveButton).toBeDisabled();
    await expect(appConfigPage.discardButton).toBeDisabled();

    // Still typing, focus still in the editor. A disabled button swallows the click that would
    // have blurred it, so anything that only reacts on blur cannot be clicked at all.
    await appConfigPage.typeIntoConfiguration('# a note');

    await expect(appConfigPage.saveButton).toBeEnabled();
    await expect(appConfigPage.discardButton).toBeEnabled();
  });

  test('will not save YAML that does not parse', async ({ appConfigPage, mimirAlertmanager }) => {
    await mimirAlertmanager.seedConfig(seededDocument);
    await appConfigPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);

    await appConfigPage.fillConfiguration('route: "unclosed\n');

    await expect.poll(() => appConfigPage.getYamlProblems()).toEqual(['2: Missing closing "quote']);
    await expect(appConfigPage.saveButton).toBeDisabled();
  });

  test('puts the stored configuration back when changes are discarded', async ({
    appConfigPage,
    mimirAlertmanager,
  }) => {
    await mimirAlertmanager.seedConfig(seededDocument);
    await appConfigPage.gotoWithAlertmanager(mimirAlertmanager.uid);
    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);

    await appConfigPage.fillConfiguration('route:\n  receiver: throwaway\n');
    await appConfigPage.discardButton.click();

    await expect.poll(() => appConfigPage.getConfiguration()).toBe(seededConfiguration);
  });

  test('offers no editor for a vanilla Alertmanager, and says why', async ({ appConfigPage }) => {
    await appConfigPage.gotoWithAlertmanager(VANILLA_ALERTMANAGER_UID);

    await expect(appConfigPage.unavailableMessage).toBeVisible();
    await expect(appConfigPage.saveButton).toBeHidden();
    await expect(appConfigPage.acknowledgeLabel).toBeHidden();

    // The running configuration is still readable, which is the only view vanilla ever had. The
    // Alertmanager writes it out with a `global:` block it filled in itself, which the seeded file
    // on disk does not have, so this doubles as a check that the two tabs really differ.
    await appConfigPage.openResolvedTab();
    await expect.poll(() => appConfigPage.getConfiguration()).toContain('global:');
  });
});
