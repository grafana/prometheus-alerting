import pRetry from 'p-retry';

const LOKI_RULER_BASE_URL = 'http://localhost:3100/loki/api/v1/rules';
const LOKI_RUNTIME_RULES_URL = 'http://localhost:3100/prometheus/api/v1/rules';

interface LokiRuntimeRule {
  name: string;
}

interface LokiRuntimeGroup {
  file: string;
  name: string;
  rules: LokiRuntimeRule[];
}

interface LokiRuntimeRulesResponse {
  data: {
    groups: LokiRuntimeGroup[];
  };
}

/** Seed or replace a Loki rule group through the Ruler API. */
export async function postLokiRuleGroup(namespace: string, config: string): Promise<void> {
  const url = `${LOKI_RULER_BASE_URL}/${encodeURIComponent(namespace)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/yaml' },
    body: config,
  });

  if (!response.ok) {
    throw new Error(`Failed to save Loki rules for namespace ${namespace}: HTTP ${response.status}`);
  }
}

/**
 * Delete a Loki rule group via the Ruler API.
 * Safe to call when the group does not exist (404 is treated as success).
 */
export async function deleteLokiRuleGroup(namespace: string, group: string): Promise<void> {
  const url = `${LOKI_RULER_BASE_URL}/${encodeURIComponent(namespace)}/${encodeURIComponent(group)}`;
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Loki group ${namespace}/${group}: HTTP ${response.status}`);
  }
}

/** Wait until Loki's runtime API contains every requested rule in a Ruler group. */
export async function waitForLokiRules(
  namespace: string,
  groupName: string,
  ruleNames: readonly string[]
): Promise<void> {
  await pRetry(
    async () => {
      const response = await fetch(LOKI_RUNTIME_RULES_URL);
      if (!response.ok) {
        throw new Error(`Loki runtime rules request failed: HTTP ${response.status}`);
      }

      const data = (await response.json()) as LokiRuntimeRulesResponse;
      const group = data.data.groups.find((candidate) => candidate.file === namespace && candidate.name === groupName);
      const runtimeRuleNames = new Set(group?.rules.map((rule) => rule.name));
      const missingRuleNames = ruleNames.filter((ruleName) => !runtimeRuleNames.has(ruleName));

      if (missingRuleNames.length > 0) {
        throw new Error(`Loki group ${namespace}/${groupName} is missing: ${missingRuleNames.join(', ')}`);
      }
    },
    {
      retries: 30,
      minTimeout: 1000,
      maxTimeout: 1000,
      factor: 1,
    }
  );
}
