import { getDataSourceSrv } from '@grafana/runtime';
import { getDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import type { FlavorContext, RulesSourceFlavor } from '@grafana/external-rules/ruler';

import { createRulerTransport } from './transport';
import { vanillaFlavor } from './vanilla';

/**
 * Every rules-source flavor the plugin supports, keyed by Grafana data source **plugin type**.
 *
 * This is the single place a flavor is wired in, and the single source of truth for which data
 * sources the plugin will touch -- the picker filters, the rule-editor validation, and the
 * rules-source enumeration all derive from these keys. Deleting an entry removes the flavor
 * everywhere.
 *
 * Note the axis: keys are plugin types, not applications. Prometheus, Mimir, and Cortex all
 * register as `prometheus` and are told apart at runtime by `discoverFeatures`.
 */
export const flavors: Record<string, RulesSourceFlavor> = {
  prometheus: vanillaFlavor({
    promRulesPath: 'api/v1/rules',
    queryPath: 'api/v1/query',
    probeBuildInfo: true,
    applicationWithoutBuildInfo: 'cortex',
    ruler: { path: 'config/v1/rules', probePath: 'api/v1/ruler/test/test' },
  }),
  loki: vanillaFlavor({
    promRulesPath: 'prometheus/api/v1/rules',
    queryPath: 'loki/api/v1/query',
    probeBuildInfo: false,
    applicationWithoutBuildInfo: 'loki',
    ruler: { path: 'api/prom/rules', probePath: 'api/prom/rules' },
  }),
};

/** Data source plugin types that can act as a rules source. */
export const supportedRulesSourceTypes = Object.keys(flavors);

export function isSupportedRulesSourceType(type: string): boolean {
  return Object.hasOwn(flavors, type);
}

/**
 * Resolves the flavor for a data source, or `undefined` when the data source is missing or its
 * type is not a supported rules source. Callers on a path where the data source is already known
 * to be supported should prefer {@link getFlavorOrThrow}.
 */
export function getFlavor(dataSourceUid: string): RulesSourceFlavor | undefined {
  const settings = getDataSourceSrv().getInstanceSettings(dataSourceUid);

  return settings ? flavors[settings.type] : undefined;
}

export function getFlavorOrThrow(dataSourceUid: string): RulesSourceFlavor {
  const settings = getDataSourceSrv().getInstanceSettings(dataSourceUid);

  if (!settings) {
    throw new Error(`Could not find datasource settings for ${dataSourceUid}`);
  }

  const flavor = flavors[settings.type];

  if (!flavor) {
    throw new Error(`Unsupported rules datasource type: ${settings.type}`);
  }

  return flavor;
}

/**
 * Async variant of {@link getFlavorOrThrow}. Uses the `@grafana/runtime/unstable` accessor, which
 * populates the instance-settings cache for data sources the frontend has not loaded yet -- use
 * it on the feature-discovery path, which may run before anything else has touched the data
 * source.
 */
export async function resolveFlavorOrThrow(dataSourceUid: string): Promise<RulesSourceFlavor> {
  const settings = await getDataSourceInstanceSettings(dataSourceUid);

  if (!settings) {
    throw new Error(`Data source with uid "${dataSourceUid}" not found`);
  }

  const flavor = flavors[settings.type];

  if (!flavor) {
    throw new Error(`Unsupported rules datasource type: ${settings.type}`);
  }

  return flavor;
}

/** Builds the context handed to a flavor: its data source UID and a transport bound to it. */
export function flavorContext(dataSourceUid: string): FlavorContext {
  return { dataSourceUid, transport: createRulerTransport(dataSourceUid) };
}
