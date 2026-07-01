/**
 * Alert helpers for e2e tests.
 * Goes through the Grafana datasource proxy so requests target the correct Alertmanager.
 */

import { GRAFANA_PROXY_BASE } from './shared';

export interface PostableAlert {
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  generatorURL?: string;
}

/** POST active alerts to an Alertmanager via the datasource proxy. */
export async function postAlerts(dataSourceUID: string, alerts: PostableAlert[]): Promise<void> {
  const url = `${GRAFANA_PROXY_BASE}/${dataSourceUID}/api/v2/alerts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alerts),
  });

  if (!response.ok) {
    throw new Error(`Failed to POST alerts to ${dataSourceUID}: HTTP ${response.status}`);
  }
}

/** Build a minimal active alert with sensible defaults; override any field. */
export function createTestAlert(overrides: Partial<PostableAlert> & { labels: Record<string, string> }): PostableAlert {
  return {
    annotations: { summary: 'e2e test alert' },
    endsAt: '0001-01-01T00:00:00Z',
    generatorURL: 'http://prometheus:9090/graph',
    ...overrides,
  };
}
