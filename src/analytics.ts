import { createMonitoringLogger, reportInteraction } from '@grafana/runtime';

import packageJson from '../package.json';

/**
 * Telemetry for the plugin.
 *
 * Everything here rides on the host Grafana's own Faro / analytics plumbing – we deliberately do not
 * stand up a plugin-owned Faro instance. Telemetry is therefore active on Grafana Cloud, stays inert
 * on-premise unless the operator has enabled it, and we have no collector of our own to run.
 *
 * Two rules for anything added here:
 *
 * 1. Never send customer data. No rule names, namespaces, label values, receiver settings or silence
 *    matchers – only counts, enums, booleans, durations and error kinds.
 * 2. Call `reportInteraction` and the loggers from this module only. Components import the named
 *    `track*` helpers, so the event catalogue stays in one place and event names stay prefixed.
 */

// Read from package.json rather than plugin.json: the latter's %VERSION% placeholder is substituted
// only in the emitted plugin.json, never in the bundle. package.json is where webpack takes that
// version from in the first place, so the two always agree.
export const pluginVersion = packageJson.version;

export const { logDebug, logInfo, logWarning, logError, logMeasurement } = createMonitoringLogger(
  'plugins.prometheusalerting',
  { module: 'PrometheusAlerting', plugin_version: pluginVersion }
);

/** Groups our events in the analytics backend, and keeps them out of core Grafana's namespace. */
const INTERACTION_PREFIX = 'grafana_prometheusalerting_';

/**
 * Deliberately narrow, so an `Error` or a config object can't be passed by mistake. Strings still
 * need care – nothing stops one holding a rule name.
 */
type InteractionProperties = Record<string, string | number | boolean>;

/**
 * Report a user interaction. Prefer adding a named `track*` helper here over calling this from a
 * component, so that every event we emit is discoverable from this file.
 */
export function trackInteraction(name: string, properties: InteractionProperties = {}) {
  reportInteraction(`${INTERACTION_PREFIX}${name}`, { ...properties, plugin_version: pluginVersion });
}
