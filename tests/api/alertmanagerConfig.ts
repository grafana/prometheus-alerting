/**
 * Mimir Alertmanager configuration helpers for e2e tests.
 * Hits Mimir directly on :9009 with the tenant header.
 */

const MIMIR_ALERTMANAGER_CONFIG_URL = 'http://localhost:9009/api/v1/alerts';
const MIMIR_ORG_HEADER = { 'X-Scope-OrgID': 'anonymous' } as const;

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
 * Reset the Mimir Alertmanager configuration back to an initialized-but-empty state (a valid
 * config with zero inhibit rules).
 *
 * NOTE: Mimir stores one config per tenant (`anonymous`), so it is a single shared mutable
 * resource. Write tests against the Mimir Alertmanager must run serially and reset here between
 * tests to stay isolated — see `00-shared-infra.md`.
 */
export async function resetMimirAlertmanagerConfig(): Promise<void> {
  const response = await fetch(MIMIR_ALERTMANAGER_CONFIG_URL, {
    method: 'POST',
    headers: { ...MIMIR_ORG_HEADER, 'Content-Type': 'application/yaml' },
    body: EMPTY_MIMIR_ALERTMANAGER_CONFIG,
  });

  if (!response.ok) {
    throw new Error(`Failed to reset Mimir Alertmanager config: HTTP ${response.status}`);
  }
}
