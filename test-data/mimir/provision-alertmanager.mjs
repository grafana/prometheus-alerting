#!/usr/bin/env node

/**
 * Mimir Alertmanager Provisioner
 * Uploads the Alertmanager configuration in /alertmanager to the Mimir tenant.
 * Expected structure:
 *   /alertmanager/alertmanager.yml   - the Alertmanager config
 *   /alertmanager/templates/*.tmpl   - notification templates (optional)
 *
 * Mimir starts every tenant without an Alertmanager config, and its config API
 * answers `404 alertmanager storage object not found` until something is posted.
 * The plugin treats that 404 as "Mimir is still starting up" and keeps retrying,
 * so without this step the Alertmanager pages sit on a loading skeleton forever.
 */

import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const MIMIR_URL = 'http://mimir:9009';
const ORG_HEADER = { 'X-Scope-OrgID': 'anonymous' };
const CONFIG_URL = `${MIMIR_URL}/api/v1/alerts`;
const ALERTMANAGER_DIR = '/alertmanager';
const CONFIG_FILE = path.join(ALERTMANAGER_DIR, 'alertmanager.yml');
const TEMPLATES_DIR = path.join(ALERTMANAGER_DIR, 'templates');

/** Poll the config API until Mimir answers. A 404 means "ready, but no config yet". */
async function waitForAlertmanagerApi() {
  console.log('Waiting for Mimir Alertmanager API...');
  while (true) {
    try {
      const response = await fetch(CONFIG_URL, { headers: ORG_HEADER });
      if (response.ok || response.status === 404) {
        console.log('✓ Mimir Alertmanager API ready');
        return response.ok;
      }
    } catch {
      // Mimir not reachable yet - keep polling.
    }
    await sleep(1000);
  }
}

function readTemplateFiles() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => [entry.name, fs.readFileSync(path.join(TEMPLATES_DIR, entry.name), 'utf8')])
  );
}

async function provisionAlertmanagerConfig() {
  const alertmanagerConfig = fs.readFileSync(CONFIG_FILE, 'utf8');
  const templateFiles = readTemplateFiles();

  console.log(`Provisioning ${CONFIG_FILE} with ${Object.keys(templateFiles).length} template file(s)...`);

  // Mimir parses the body as YAML, and JSON happens to be valid YAML - encoding it
  // this way avoids hand-indenting the config into a YAML block scalar.
  const response = await fetch(CONFIG_URL, {
    method: 'POST',
    headers: { ...ORG_HEADER, 'Content-Type': 'application/yaml' },
    body: JSON.stringify({ template_files: templateFiles, alertmanager_config: alertmanagerConfig }),
  });

  if (!response.ok) {
    throw new Error(`Failed to provision Alertmanager config: HTTP ${response.status} ${await response.text()}`);
  }

  console.log('✓ Provisioned Alertmanager configuration');
}

const alreadyConfigured = await waitForAlertmanagerApi();

// Don't clobber changes made from the plugin UI if this container is restarted.
if (alreadyConfigured) {
  console.log('⚠ Tenant already has an Alertmanager configuration - leaving it alone');
} else {
  await provisionAlertmanagerConfig();
}
