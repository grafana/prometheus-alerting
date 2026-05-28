const MIMIR_RULER_BASE_URL = 'http://localhost:9009/prometheus/config/v1/rules';
const MIMIR_ORG_HEADER = { 'X-Scope-OrgID': 'anonymous' } as const;

/**
 * Delete a Mimir rule group via the Ruler API.
 * Safe to call when the group does not exist (404 is treated as success).
 */
export async function deleteMimirRuleGroup(namespace: string, group: string): Promise<void> {
  const url = `${MIMIR_RULER_BASE_URL}/${encodeURIComponent(namespace)}/${encodeURIComponent(group)}`;
  const response = await fetch(url, { method: 'DELETE', headers: MIMIR_ORG_HEADER });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Mimir group ${namespace}/${group}: HTTP ${response.status}`);
  }
}
