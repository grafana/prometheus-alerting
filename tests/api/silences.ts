/**
 * Silence helpers for e2e tests.
 * Goes through the Grafana datasource proxy so requests target the correct Alertmanager.
 */

import { GRAFANA_PROXY_BASE } from './shared';

export async function createSilence(dataSourceUID: string, silence: unknown): Promise<string> {
  const url = `${GRAFANA_PROXY_BASE}/${dataSourceUID}/api/v2/silences`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(silence),
  });

  if (!response.ok) {
    throw new Error(`Failed to create silence on ${dataSourceUID}: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { silenceID?: string; id?: string };
  return data.silenceID ?? data.id ?? '';
}

export async function deleteSilence(dataSourceUID: string, silenceId: string): Promise<void> {
  const url = `${GRAFANA_PROXY_BASE}/${dataSourceUID}/api/v2/silence/${silenceId}`;
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete silence ${silenceId} on ${dataSourceUID}: HTTP ${response.status}`);
  }
}
