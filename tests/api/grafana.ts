const GRAFANA_URL = 'http://localhost:3000';

interface MimirAlertmanagerDataSource {
  uid: string;
  name: string;
  tenantId: string;
}

interface MimirRulerDataSource {
  uid: string;
  name: string;
  tenantId: string;
  /**
   * "Manage alerts via Alerting UI". Defaults to true, as the provisioned test data sources do.
   * Pass false to create a data source the alerting UI is meant to leave alone.
   */
  manageAlerts?: boolean;
}

interface LokiRulerDataSource {
  uid: string;
  name: string;
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

/** Create a Mimir Prometheus datasource whose Ruler API requests use the given tenant header. */
export async function createMimirRulerDataSource({
  uid,
  name,
  tenantId,
  manageAlerts = true,
}: MimirRulerDataSource): Promise<void> {
  const response = await fetch(`${GRAFANA_URL}/api/datasources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      name,
      type: 'prometheus',
      access: 'proxy',
      url: 'http://mimir:9009/prometheus',
      isDefault: false,
      jsonData: {
        manageAlerts,
        prometheusType: 'Mimir',
        prometheusVersion: '2.40.0',
        implementation: 'mimir',
        httpHeaderName1: 'X-Scope-OrgID',
        httpMethod: 'POST',
        customQueryParameters: '',
        disableRecordingRules: false,
      },
      secureJsonData: {
        httpHeaderValue1: tenantId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Mimir Ruler datasource ${uid}: HTTP ${response.status}`);
  }

  const readback = await fetch(getDataSourceUrl(uid));
  if (!readback.ok) {
    throw new Error(`Created Mimir Ruler datasource ${uid} could not be read back: HTTP ${readback.status}`);
  }
}

/** Create a Loki datasource that supports the Ruler API. */
export async function createLokiRulerDataSource({ uid, name }: LokiRulerDataSource): Promise<void> {
  const response = await fetch(`${GRAFANA_URL}/api/datasources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid,
      name,
      type: 'loki',
      access: 'proxy',
      url: 'http://loki:3100',
      isDefault: false,
      jsonData: {
        manageAlerts: true,
        maxLines: 1000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Loki Ruler datasource ${uid}: HTTP ${response.status}`);
  }

  const readback = await fetch(getDataSourceUrl(uid));
  if (!readback.ok) {
    throw new Error(`Created Loki Ruler datasource ${uid} could not be read back: HTTP ${readback.status}`);
  }
}

/** Delete a fixture-created datasource. It is safe to call if setup did not complete. */
export async function deleteGrafanaDataSource(uid: string): Promise<void> {
  const response = await fetch(getDataSourceUrl(uid), { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Grafana datasource ${uid}: HTTP ${response.status}`);
  }
}
