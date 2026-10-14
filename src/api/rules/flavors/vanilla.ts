import type {
  DataSourceFeatures,
  RulerBackend,
  RulerRulesConfigDTO,
  RulerTransport,
  RulesSourceApplication,
  RulesSourceFlavor,
} from '@grafana/external-rules/ruler';
import type { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import * as yaml from 'js-yaml';

import type { PromBuildInfoResponse } from '../../../types/rules';
import { isForbiddenError, isNotFoundError } from '../../../utils/errors';

/**
 * The flavor for backends whose rules are read through the Prometheus-compatible API over the
 * datasource proxy: vanilla Prometheus, Mimir, Cortex, and Loki. They differ only in paths, in
 * whether `/api/v1/status/buildinfo` is worth probing, and in whether a Cortex-style Ruler is
 * reachable at all -- so they share one implementation, just configured differently, rather
 * than having one each.
 */
export interface VanillaFlavorOptions {
  promRulesPath: string;
  queryPath: string;
  /**
   * Whether to fetch `/api/v1/status/buildinfo`. Loki's carries no feature information, and a
   * backend that has no such endpoint at all should also set this to false -- probing it there
   * would turn an unrelated error envelope into a failed discovery.
   */
  probeBuildInfo: boolean;
  /** Application reported when the backend has no buildinfo endpoint. */
  applicationWithoutBuildInfo: RulesSourceApplication;
  /**
   * The backend's Cortex-style Ruler configuration API, if it has one reachable through the
   * datasource proxy.
   *
   * Omit for backends that do not: discovery then reports `rulerApiEnabled: false` without probing,
   * and asking for a Ruler backend throws rather than issuing requests against a path that cannot
   * work.
   */
  ruler?: {
    /** Ruler CRUD base path, e.g. `config/v1/rules`. */
    path: string;
    /**
     * Path probed to decide whether the Ruler API is available. Prometheus-compatible sources use
     * the rule-group probe Grafana Alerting uses for Ruler discovery, which is not the CRUD path.
     */
    probePath: string;
  };
}

const RULER_NOT_SUPPORTED_MSG = 'ruler API is not enabled';

export function vanillaFlavor(options: VanillaFlavorOptions): RulesSourceFlavor {
  return {
    promRulesPath: options.promRulesPath,
    queryPath: options.queryPath,
    // Buildinfo is what distinguishes Prometheus from Mimir, so a flavor that does not need it is
    // one whose application is already settled by the plugin type.
    application: options.probeBuildInfo ? undefined : options.applicationWithoutBuildInfo,
    discoverFeatures: ({ transport }) => discoverFeatures(transport, options),
    createRulerBackend: ({ transport }) => {
      if (!options.ruler) {
        // Unreachable through the UI: every write path is gated on `rulerApiEnabled`, which
        // discovery reports as false for these backends. Throwing keeps it that way if a caller
        // ever forgets the gate, rather than issuing requests against a path that cannot work.
        throw new Error('This data source has no Ruler configuration API reachable through the datasource proxy');
      }

      return createVanillaRulerBackend(transport, options.ruler.path);
    },
  };
}

export function createVanillaRulerBackend(transport: RulerTransport, rulerPath: string): RulerBackend {
  const base = rulerPath.split('/');

  return {
    async getRuleGroup(namespace, groupName) {
      const response = await transport<string>({
        segments: [...base, namespace, groupName],
        responseType: 'text',
      });

      return parseYaml<RulerRuleGroupDTO | null>(response, null);
    },

    async getRuleNamespaceYaml(namespace) {
      return transport<string>({ segments: [...base, namespace], responseType: 'text' });
    },

    async getAllRules() {
      const response = await transport<string>({ segments: base, responseType: 'text' });

      return parseYaml<RulerRulesConfigDTO>(response, {});
    },

    async upsertRuleGroup(namespace, group) {
      await transport<string>({
        method: 'POST',
        segments: [...base, namespace],
        headers: { 'Content-Type': 'application/yaml' },
        body: yaml.dump(group),
        responseType: 'text',
      });
    },

    async deleteRuleGroup(namespace, groupName) {
      await transport<void>({ method: 'DELETE', segments: [...base, namespace, groupName] });
    },
  };
}

function parseYaml<T>(response: string, whenEmpty: T): T {
  if (!response || response.trim() === '') {
    return whenEmpty;
  }

  try {
    return yaml.load(response) as T;
  } catch (error) {
    console.error('Failed to parse YAML response:', error);
    throw error;
  }
}

async function discoverFeatures(transport: RulerTransport, options: VanillaFlavorOptions): Promise<DataSourceFeatures> {
  const buildInfo = options.probeBuildInfo ? await fetchBuildInfo(transport) : undefined;

  // No buildinfo endpoint available (Cortex or Loki)
  if (!buildInfo) {
    // Check if we can fetch rules via the prometheus compatible api
    // Let the original failure through – its status, body and trace id explain *why* the data
    // source is unusable, which a generic message would throw away
    await probeEndpoint(transport, options.promRulesPath);

    // Check if the ruler API is enabled
    const hasRuler = options.ruler ? await testRulerSupport(transport, options.ruler.probePath) : false;

    return {
      application: options.applicationWithoutBuildInfo,
      rulerApiEnabled: hasRuler,
    };
  }

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
 * Attempt to fetch buildinfo from the data source.
 * Returns undefined if the endpoint doesn't exist (404) or if there's an error.
 */
async function fetchBuildInfo(transport: RulerTransport): Promise<PromBuildInfoResponse | undefined> {
  try {
    return await transport<PromBuildInfoResponse>({ segments: ['api', 'v1', 'status', 'buildinfo'] });
  } catch (error) {
    // 404 means the endpoint doesn't exist (Cortex or old Prometheus)
    if (isNotFoundError(error)) {
      return undefined;
    }

    // Other errors should be thrown
    throw error;
  }
}

/** Test if the data source supports the Ruler API for editing rules. */
async function testRulerSupport(transport: RulerTransport, probePath: string): Promise<boolean> {
  try {
    // Read as text: a probe asks whether the endpoint responds, not whether its body parses. Loki's
    // ruler answers `application/yaml`, which a JSON probe would reject as unsupported.
    await transport({ segments: probePath.split('/'), responseType: 'text' });
    return true;
  } catch (error) {
    if (isForbiddenError(error)) {
      throw error;
    }

    // Keep known "Ruler unavailable" responses separate from permission failures.
    // The previous implementation returned false for every remaining error, so
    // removing this check did not change behavior; retaining it documents the
    // backend responses that specifically mean the Ruler API is unsupported.
    if (errorIndicatesMissingRulerSupport(error)) {
      return false;
    }

    // Preserve the existing conservative behavior for unrecognized failures.
    return false;
  }
}

/** Throws the original failure when an endpoint does not respond successfully. */
async function probeEndpoint(transport: RulerTransport, path: string): Promise<void> {
  // Text for the same reason as the Ruler probe: reachability, not response shape.
  await transport({ segments: path.split('/'), responseType: 'text' });
}

/**
 * Check if an error indicates that the Ruler API is not supported.
 */
export function errorIndicatesMissingRulerSupport(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
    const message = error.data.message;

    if (typeof message === 'string') {
      return (
        message.includes('GetRuleGroup unsupported in rule local store') ||
        message.includes('page not found') ||
        message.includes(RULER_NOT_SUPPORTED_MSG)
      );
    }
  }

  return error instanceof Error && error.message.includes('404 from rules config endpoint');
}
