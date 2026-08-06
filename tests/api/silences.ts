/**
 * Mimir Alertmanager silence helpers for e2e tests.
 *
 * Silences live behind the Alertmanager v2 runtime API rather than the configuration API, so they
 * are seeded directly against Mimir on :9009 with the tenant header — the same path the plugin
 * proxies to (`/{uid}/alertmanager/api/v2/silences`).
 */

const MIMIR_ALERTMANAGER_SILENCES_URL = 'http://localhost:9009/alertmanager/api/v2/silences';

interface SeedSilenceOptions {
  matcherName: string;
  matcherValue: string;
  comment: string;
  /** How long the silence lasts, in hours. */
  durationHours?: number;
}

/**
 * Create a silence for the given test tenant and return its ID.
 *
 * Mimir starts a tenant's Alertmanager lazily, on its configuration poll loop, and answers
 * `406 Not Acceptable — Not initializing the Alertmanager` until that instance is up. The POST is
 * therefore retried for longer than one poll interval rather than failing on a cold tenant.
 */
export async function seedMimirSilence(
  tenantId: string,
  { matcherName, matcherValue, comment, durationHours = 2 }: SeedSilenceOptions
): Promise<string> {
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
  const body = JSON.stringify({
    matchers: [{ name: matcherName, value: matcherValue, isRegex: false, isEqual: true }],
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    createdBy: 'e2e',
    comment,
  });

  let lastStatus = 0;

  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await fetch(MIMIR_ALERTMANAGER_SILENCES_URL, {
      method: 'POST',
      headers: { 'X-Scope-OrgID': tenantId, 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      const { silenceID } = await response.json();

      return silenceID;
    }

    lastStatus = response.status;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Failed to seed Mimir silence for ${tenantId}: HTTP ${lastStatus}`);
}
