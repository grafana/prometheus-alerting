/**
 * Mimir Alertmanager configuration helpers for e2e tests.
 * Hits Mimir directly on :9009 with the tenant header.
 */

const MIMIR_ALERTMANAGER_CONFIG_URL = 'http://localhost:9009/api/v1/alerts';

function getMimirOrgHeader(tenantId: string) {
  return { 'X-Scope-OrgID': tenantId } as const;
}

/**
 * A minimal, valid Alertmanager configuration with no inhibit rules. Posting this initializes the
 * tenant so the config API returns 200 with an empty rule set.
 *
 * Deleting the tenant config instead leaves Mimir returning `404 alertmanager storage object not
 * found` for GET /api/v1/alerts. The plugin treats that 404 as a *lazy-initialization* error and
 * retries indefinitely (see `isLazyInitializationError` in
 * `src/api/alertmanager/mimir.utils.ts`), so the page hangs on the loading skeleton and never shows
 * the empty state. Real Mimir/Grafana Cloud tenants are always initialized, so we mirror that here.
 */
const EMPTY_MIMIR_ALERTMANAGER_CONFIG = `template_files: {}
alertmanager_config: |
  route:
    receiver: empty-default-receiver
  receivers:
    - name: empty-default-receiver
`;

/**
 * Post a raw Alertmanager configuration (the same `template_files` + `alertmanager_config` YAML
 * document accepted by Mimir's `/api/v1/alerts`) to the given test tenant.
 */
export async function postMimirAlertmanagerConfig(tenantId: string, config: string): Promise<void> {
  const response = await fetch(MIMIR_ALERTMANAGER_CONFIG_URL, {
    method: 'POST',
    headers: { ...getMimirOrgHeader(tenantId), 'Content-Type': 'application/yaml' },
    body: config,
  });

  if (!response.ok) {
    throw new Error(`Failed to post Mimir Alertmanager config for ${tenantId}: HTTP ${response.status}`);
  }
}

/**
 * Initialize a tenant with a valid config containing no templates or inhibit rules.
 */
export async function initializeMimirAlertmanagerConfig(tenantId: string): Promise<void> {
  await postMimirAlertmanagerConfig(tenantId, EMPTY_MIMIR_ALERTMANAGER_CONFIG);
}

/** Delete a test tenant's Alertmanager config. A missing config is already clean. */
export async function deleteMimirAlertmanagerConfig(tenantId: string): Promise<void> {
  const response = await fetch(MIMIR_ALERTMANAGER_CONFIG_URL, {
    method: 'DELETE',
    headers: getMimirOrgHeader(tenantId),
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Mimir Alertmanager config for ${tenantId}: HTTP ${response.status}`);
  }
}

/**
 * Fetch a test tenant's Alertmanager configuration document as Mimir stores it, so a test can
 * assert on the exact bytes the plugin wrote.
 */
export async function getMimirAlertmanagerConfig(tenantId: string): Promise<string> {
  const response = await fetch(MIMIR_ALERTMANAGER_CONFIG_URL, {
    headers: getMimirOrgHeader(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Mimir Alertmanager config for ${tenantId}: HTTP ${response.status}`);
  }

  return response.text();
}
