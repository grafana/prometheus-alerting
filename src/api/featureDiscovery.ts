import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { DataSourceFeatures, PromBuildInfoResponse } from '../types/rules';

export type { DataSourceFeatures };

const RULER_NOT_SUPPORTED_MSG = 'ruler API is not enabled';

/**
 * Main feature discovery function that determines what capabilities a data source has
 */
export async function discoverDataSourceFeatures(uid: string): Promise<DataSourceFeatures> {
  const dataSourceSrv = getDataSourceSrv();
  const dsSettings = dataSourceSrv.getInstanceSettings(uid);

  if (!dsSettings) {
    throw new Error(`Data source with uid "${uid}" not found`);
  }

  const type = dsSettings.type;

  // Skip buildinfo for Loki as it doesn't provide useful feature information
  const buildInfo = type === 'loki' ? undefined : await fetchBuildInfo(uid);

  // No buildinfo endpoint available (Cortex or Loki)
  if (!buildInfo) {
    // Check if we can fetch rules via the prometheus compatible api
    const hasPromRules = await testPromRulesSupport(uid);
    if (!hasPromRules) {
      throw new Error(`Unable to fetch alert rules. Is the data source properly configured?`);
    }

    // Check if the ruler API is enabled
    const hasRuler = await testRulerSupport(uid);

    return {
      application: type === 'loki' ? 'loki' : 'cortex',
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
export async function fetchBuildInfo(uid: string): Promise<PromBuildInfoResponse | undefined> {
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
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return undefined;
    }

    // Other errors should be thrown
    throw error;
  }
}

/**
 * Test if the data source supports fetching rules via Prometheus API
 */
async function testPromRulesSupport(uid: string): Promise<boolean> {
  try {
    await lastValueFrom(
      getBackendSrv().fetch({
        url: `/api/datasources/proxy/uid/${uid}/api/v1/rules`,
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Test if the data source supports the Ruler API for editing rules
 */
async function testRulerSupport(uid: string): Promise<boolean> {
  try {
    await lastValueFrom(
      getBackendSrv().fetch({
        url: `/api/datasources/proxy/uid/${uid}/api/v1/ruler/test/test`,
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return true;
  } catch (error) {
    // Check if the error indicates missing ruler support
    if (errorIndicatesMissingRulerSupport(error)) {
      return false;
    }

    // Other errors might indicate the ruler is available but there's a different issue
    // We'll be conservative and assume ruler is not available
    return false;
  }
}

/**
 * Check if an error indicates that the Ruler API is not supported
 */
function errorIndicatesMissingRulerSupport(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check for fetch error with data.message
  if ('data' in error && error.data && typeof error.data === 'object') {
    const data = error.data as { message?: string };
    if (data.message) {
      return (
        data.message.includes('GetRuleGroup unsupported in rule local store') ||
        data.message.includes('page not found') ||
        data.message.includes(RULER_NOT_SUPPORTED_MSG)
      );
    }
  }

  // Check for Error with message
  if (error instanceof Error && error.message) {
    return error.message.includes('404 from rules config endpoint');
  }

  return false;
}
