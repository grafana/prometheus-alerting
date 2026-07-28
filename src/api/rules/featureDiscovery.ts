import { getBackendSrv } from '@grafana/runtime';
import { getDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import { lastValueFrom } from 'rxjs';

import { DataSourceFeatures, getPrometheusRulesApiBasePath, PromBuildInfoResponse } from '../../types/rules';
import { isForbiddenError, isNotFoundError } from '../../utils/errors';

export type { DataSourceFeatures };

/**
 * Main feature discovery function that determines what capabilities a data source has
 */
export async function discoverDataSourceFeatures(uid: string): Promise<DataSourceFeatures> {
  const dsSettings = await getDataSourceInstanceSettings(uid);

  if (!dsSettings) {
    throw new Error(`Data source with uid "${uid}" not found`);
  }

  const type = dsSettings.type;

  // Skip buildinfo for Loki as it doesn't provide useful feature information
  const buildInfo = type === 'loki' ? undefined : await fetchBuildInfo(uid);

  // No buildinfo endpoint available (Cortex or Loki)
  if (!buildInfo) {
    const application = type === 'loki' ? 'loki' : 'cortex';

    // Check if we can fetch rules via the prometheus compatible api
    const hasPromRules = await testPromRulesSupport(uid, type);
    if (!hasPromRules) {
      throw new Error(`Unable to fetch alert rules. Is the data source properly configured?`);
    }

    // Check if the ruler API is enabled
    const hasRuler = await testRulerSupport(uid, type);

    return {
      application,
      rulerApiEnabled: hasRuler,
    };
  }

  // Has buildinfo endpoint
  const { features } = buildInfo.data;

  // Buildinfo but no features → vanilla Prometheus
  if (!features) {
    return {
      application: 'prometheus',
      rulerApiEnabled: false,
    };
  }

  // Has features → Mimir
  return {
    application: 'mimir',
    rulerApiEnabled: features.ruler_config_api === 'true',
  };
}

/**
 * Attempt to fetch buildinfo from the data source
 * Returns undefined if the endpoint doesn't exist (404) or if there's an error
 */
async function fetchBuildInfo(uid: string): Promise<PromBuildInfoResponse | undefined> {
  try {
    const response = await lastValueFrom(
      getBackendSrv().fetch<PromBuildInfoResponse>({
        url: `/api/datasources/proxy/uid/${uid}/api/v1/status/buildinfo`,
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    return response.data;
  } catch (error) {
    // 404 means the endpoint doesn't exist (Cortex or old Prometheus)
    if (isNotFoundError(error)) {
      return undefined;
    }

    // Other errors should be thrown
    throw error;
  }
}

/**
 * Test if the data source supports fetching rules via Prometheus API
 */
async function testPromRulesSupport(uid: string, type: string): Promise<boolean> {
  const path = getPrometheusRulesApiBasePath(type === 'loki' ? 'loki' : 'prometheus');
  return isEndpointAvailable(`/api/datasources/proxy/uid/${uid}/${path}`);
}

/**
 * Test if the data source supports the Ruler API for editing rules
 */
async function testRulerSupport(uid: string, type: string): Promise<boolean> {
  // Loki uses its YAML Ruler endpoint; Prometheus-compatible sources use the
  // rule-group probe Grafana Alerting uses for Ruler discovery.
  const path = type === 'loki' ? 'api/prom/rules' : 'api/v1/ruler/test/test';
  return isEndpointAvailable(`/api/datasources/proxy/uid/${uid}/${path}`);
}

/** Returns whether an endpoint responds successfully, while preserving permission errors for the caller. */
async function isEndpointAvailable(url: string): Promise<boolean> {
  try {
    await lastValueFrom(
      getBackendSrv().fetch({
        url,
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return true;
  } catch (error) {
    if (isForbiddenError(error)) {
      throw error;
    }

    return false;
  }
}
