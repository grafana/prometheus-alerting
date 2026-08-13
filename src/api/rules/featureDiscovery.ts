import { DataSourceFeatures } from '../../types/rules';

import { flavorContext, resolveFlavorOrThrow } from './flavors/registry';

export type { DataSourceFeatures };

// Re-exported so the discovery entry point and its callers keep a single import site.
export { errorIndicatesMissingRulerSupport } from './flavors/vanilla';

/**
 * Main feature discovery function that determines what capabilities a data source has.
 *
 * Which application is behind a data source, and whether its rules can be written, is a
 * per-flavor question -- the probes differ, and not every backend has a
 * `/api/v1/status/buildinfo` endpoint. This resolves the flavor and asks it.
 */
export async function discoverDataSourceFeatures(uid: string): Promise<DataSourceFeatures> {
  const flavor = await resolveFlavorOrThrow(uid);

  return flavor.discoverFeatures(flavorContext(uid));
}
