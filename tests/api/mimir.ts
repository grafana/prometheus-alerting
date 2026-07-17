const MIMIR_RULER_BASE_URL = 'http://localhost:9009/prometheus/config/v1/rules';
function mimirOrgHeader(tenantId: string): Record<'X-Scope-OrgID', string> {
  return { 'X-Scope-OrgID': tenantId };
}

/** Seed a rule group in a tenant through Mimir's Ruler API. */
export async function postMimirRuleGroup(tenantId: string, namespace: string, config: string): Promise<void> {
  const url = `${MIMIR_RULER_BASE_URL}/${encodeURIComponent(namespace)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/yaml', ...mimirOrgHeader(tenantId) },
    body: config,
  });

  if (!response.ok) {
    throw new Error(`Failed to seed Mimir rules for tenant ${tenantId}: HTTP ${response.status}`);
  }
}

/**
 * Delete a Mimir rule group via the Ruler API.
 * Safe to call when the group does not exist (404 is treated as success).
 */
export async function deleteMimirRuleGroup(tenantId: string, namespace: string, group: string): Promise<void> {
  const url = `${MIMIR_RULER_BASE_URL}/${encodeURIComponent(namespace)}/${encodeURIComponent(group)}`;
  const response = await fetch(url, { method: 'DELETE', headers: mimirOrgHeader(tenantId) });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Mimir group ${namespace}/${group}: HTTP ${response.status}`);
  }
}
