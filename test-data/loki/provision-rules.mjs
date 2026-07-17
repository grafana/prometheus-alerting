#!/usr/bin/env node

/**
 * Loki Rules Provisioner
 * Automatically provisions all rule files found in /rules directory
 * Expected structure: /rules/<namespace>/<group>.yaml
 */

import fs from 'node:fs';
import path from 'node:path';

const LOKI_URL = 'http://loki:3100';
const RULES_DIR = '/rules';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRulerApi() {
  console.log('Waiting for Loki Ruler API...');
  while (true) {
    try {
      const response = await fetch(`${LOKI_URL}/ready`);
      if (response.ok) {
        break;
      }
    } catch {
      // Loki not reachable yet - keep polling.
    }
    await sleep(1000);
  }
  console.log('✓ Loki Ruler API ready');
}

async function provisionRuleFile(namespace, ruleFile) {
  const group = path.basename(ruleFile, path.extname(ruleFile));
  console.group(`- Provisioning group: ${group}`);

  const body = fs.readFileSync(ruleFile);
  const response = await fetch(`${LOKI_URL}/loki/api/v1/rules/${encodeURIComponent(namespace)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/yaml' },
    body,
  });

  if (response.ok) {
    console.log(`✓ Provisioned ${namespace}/${group}`);
    console.groupEnd();
    return true;
  }

  console.log(`⚠ Failed to provision ${namespace}/${group} (may already exist)`);
  console.groupEnd();
  return false;
}

async function provisionRules() {
  console.log(`Provisioning rules from ${RULES_DIR}...`);
  let provisioned = 0;

  const namespaces = fs
    .readdirSync(RULES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const namespace of namespaces) {
    console.group(`Namespace: ${namespace}`);
    const namespaceDir = path.join(RULES_DIR, namespace);

    const ruleFiles = fs
      .readdirSync(namespaceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
      .map((entry) => path.join(namespaceDir, entry.name));

    for (const ruleFile of ruleFiles) {
      if (await provisionRuleFile(namespace, ruleFile)) {
        provisioned++;
      }
    }
    console.groupEnd();
  }

  if (provisioned === 0) {
    console.log('⚠ No rules provisioned (directory empty or rules already exist)');
  } else {
    console.log(`✓ Provisioned ${provisioned} rule group(s)`);
  }
}

await waitForRulerApi();
await provisionRules();
