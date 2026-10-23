import { z } from 'zod';

import { RulerRuleGroupDTO, RulerRuleGroupDTOSchema } from '../vanilla';

/**
 * The contract every rules-source flavor implements.
 *
 * A "flavor" is one Prometheus-compatible backend: vanilla Prometheus, Mimir/Cortex, Loki, or
 * anything else that speaks a Prometheus-compatible API. Flavors differ in how rules are read and
 * written, not in what a rule is -- they all speak the DTOs from `@grafana/external-rules/vanilla`.
 *
 * A flavor is behaviour only. It must not depend on the app: no React, no Redux, no
 * `@grafana/ui`, and no `getBackendSrv`. Everything it needs to reach the network arrives as a
 * {@link RulerTransport}. That keeps flavors independently testable and stops a flavor from
 * reaching Grafana APIs other than its own data source's proxy.
 */

/** Ruler rules config is a map of namespace -> array of rule groups. */
export const RulerRulesConfigDTOSchema = z.record(z.string(), z.array(RulerRuleGroupDTOSchema));
export type RulerRulesConfigDTO = z.infer<typeof RulerRulesConfigDTOSchema>;

export interface RulerRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /**
   * Path segments appended to this data source's proxy root. Each segment is percent-encoded,
   * so a segment must not itself contain `/` -- split multi-part static paths before passing
   * them in.
   */
  segments: string[];
  params?: Record<string, string | undefined>;
  headers?: Record<string, string>;
  body?: string;
  /**
   * Whether to parse the response as text rather than JSON. Ruler APIs that speak YAML need
   * this; JSON control-plane APIs do not.
   */
  responseType?: 'json' | 'text';
}

/**
 * Issues a request against a single data source's proxy root.
 *
 * Bound to one data source UID at construction, so a flavor cannot address another data source
 * or any other Grafana API -- see the path-escape note in `src/api/utils/proxyPath.ts`.
 */
export type RulerTransport = <T>(request: RulerRequest) => Promise<T>;

/**
 * Rule read/write operations, expressed per rule group.
 *
 * Flavors whose native API is not per-group are responsible for the read-modify-write needed to
 * present this shape.
 *
 * `getRuleGroup` **rejects** with a 404-shaped fetch error when the group does not exist -- the
 * app distinguishes "absent" from "failed" with `isNotFoundError`, and creates a blank group on
 * the former. It resolves `null` only when the backend answers successfully with an empty body.
 * A flavor whose native API reports absence differently must translate it.
 */
export interface RulerBackend {
  getRuleGroup(namespace: string, groupName: string): Promise<RulerRuleGroupDTO | null>;
  /** Returns the namespace-scoped Ruler configuration response without parsing or reformatting it. */
  getRuleNamespaceYaml(namespace: string): Promise<string>;
  getAllRules(): Promise<RulerRulesConfigDTO>;
  upsertRuleGroup(namespace: string, group: RulerRuleGroupDTO): Promise<void>;
  deleteRuleGroup(namespace: string, groupName: string): Promise<void>;
}

/** The runtime application behind a data source, used for presentation and query dialect. */
export type RulesSourceApplication = 'prometheus' | 'mimir' | 'cortex' | 'loki' | 'amp';

export interface DataSourceFeatures {
  application: RulesSourceApplication;
  rulerApiEnabled: boolean;
}

export interface FlavorContext {
  dataSourceUid: string;
  transport: RulerTransport;
}

export interface RulesSourceFlavor {
  /**
   * The application behind this flavor, when the data source's plugin type alone determines it.
   *
   * `undefined` means it cannot be known without probing -- Prometheus, Mimir, and Cortex all
   * register as `prometheus`, so only `discoverFeatures` can tell them apart. Where it *is* known,
   * the UI can label and icon the data source before discovery finishes, and still label it if
   * discovery fails.
   */
  application?: RulesSourceApplication;
  /**
   * Determines which application is behind the data source and whether rules can be written.
   * Probing is up to the flavor; nothing else may assume a `/api/v1/status/buildinfo` endpoint
   * exists.
   */
  discoverFeatures(ctx: FlavorContext): Promise<DataSourceFeatures>;
  createRulerBackend(ctx: FlavorContext): RulerBackend;
  /** Prometheus-compatible runtime rules path, e.g. `api/v1/rules`. */
  promRulesPath: string;
  /** Instant query path, e.g. `api/v1/query`. */
  queryPath: string;
}
