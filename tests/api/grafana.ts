const GRAFANA_URL = 'http://localhost:3000';

interface MimirAlertmanagerDataSource {
  uid: string;
  name: string;
  tenantId: string;
}

function getDataSourceUrl(uid: string): string {
  return `${GRAFANA_URL}/api/datasources/uid/${encodeURIComponent(uid)}`;
}

/** Create a Mimir Alertmanager datasource whose proxy requests use the given tenant header. */
export async function createMimirAlertmanagerDataSource({
  uid,
  name,
  tenantId,
}: MimirAlertmanagerDataSource): Promise<void> {
  const response = await fetch(`${GRAFANA_URL}/api/datasources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      name,
      type: 'alertmanager',
      access: 'proxy',
      url: 'http://mimir:9009',
      isDefault: false,
      jsonData: {
        implementation: 'mimir',
        httpHeaderName1: 'X-Scope-OrgID',
      },
      secureJsonData: {
        httpHeaderValue1: tenantId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Mimir Alertmanager datasource ${uid}: HTTP ${response.status}`);
  }

  const readback = await fetch(getDataSourceUrl(uid));
  if (!readback.ok) {
    throw new Error(`Created Mimir Alertmanager datasource ${uid} could not be read back: HTTP ${readback.status}`);
  }
}

/** Delete a fixture-created datasource. It is safe to call if setup did not complete. */
export async function deleteGrafanaDataSource(uid: string): Promise<void> {
  const response = await fetch(getDataSourceUrl(uid), { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Grafana datasource ${uid}: HTTP ${response.status}`);
  }
}
