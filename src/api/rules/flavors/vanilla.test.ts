import type { RulerRulesConfigDTO, RulerRequest, RulerTransport } from '@grafana/external-rules/ruler';
import { describeRulerBackend } from '@grafana/external-rules/ruler/contract';
import type { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';

// `errorIndicatesMissingRulerSupport` is covered by ../featureDiscovery.test.ts, which imports it
// through the re-export the discovery entry point keeps.
import { createVanillaRulerBackend, vanillaFlavor } from './vanilla';

/** Shaped like a Grafana fetch error so `isNotFoundError` / `isForbiddenError` recognise it. */
function fetchError(status: number, message = 'error') {
  return { status, data: { message } };
}

/**
 * A stand-in for the Cortex-style Ruler API: YAML bodies, one rule group per path, and the whole
 * config at the base path. Records every request so tests can assert the paths a flavor builds.
 */
function fakeRulerTransport(basePath: string) {
  const store: RulerRulesConfigDTO = {};
  const requests: RulerRequest[] = [];
  const base = basePath.split('/');

  const transport: RulerTransport = async <T>(request: RulerRequest) => {
    requests.push(request);

    const { method = 'GET', segments } = request;
    const prefix = segments.slice(0, base.length);
    if (prefix.join('/') !== base.join('/')) {
      throw fetchError(404, 'page not found');
    }

    const [namespace, groupName] = segments.slice(base.length);

    if (method === 'GET' && namespace === undefined) {
      return yaml.dump(store) as T;
    }

    if (method === 'GET') {
      const group = store[namespace]?.find((candidate) => candidate.name === groupName);
      if (!group) {
        throw fetchError(404, 'group does not exist');
      }
      return yaml.dump(group) as T;
    }

    if (method === 'POST') {
      const incoming = yaml.load(String(request.body)) as RulerRuleGroupDTO;
      const groups = store[namespace] ?? [];
      const index = groups.findIndex((candidate) => candidate.name === incoming.name);
      store[namespace] =
        index === -1 ? [...groups, incoming] : groups.map((candidate, at) => (at === index ? incoming : candidate));
      return '' as T;
    }

    if (method === 'DELETE') {
      const remaining = (store[namespace] ?? []).filter((candidate) => candidate.name !== groupName);
      if (remaining.length === 0) {
        delete store[namespace];
      } else {
        store[namespace] = remaining;
      }
      return undefined as T;
    }

    throw fetchError(405, `unexpected method ${method}`);
  };

  return { transport, requests };
}

// Prometheus, Mimir, and Cortex share the Cortex ruler configuration path; Loki serves its own.
describeRulerBackend('vanilla (config/v1/rules)', () =>
  createVanillaRulerBackend(fakeRulerTransport('config/v1/rules').transport, 'config/v1/rules')
);

describeRulerBackend('vanilla (Loki, api/prom/rules)', () =>
  createVanillaRulerBackend(fakeRulerTransport('api/prom/rules').transport, 'api/prom/rules')
);

describe('vanilla ruler paths', () => {
  it('splits the ruler base path into separate segments so each is encoded independently', async () => {
    const { transport, requests } = fakeRulerTransport('config/v1/rules');
    const backend = createVanillaRulerBackend(transport, 'config/v1/rules');

    await backend.upsertRuleGroup('my namespace', { name: 'my group', interval: '1m', rules: [] });
    await backend.deleteRuleGroup('my namespace', 'my group');

    expect(requests[0]).toMatchObject({
      method: 'POST',
      segments: ['config', 'v1', 'rules', 'my namespace'],
      headers: { 'Content-Type': 'application/yaml' },
    });
    expect(requests[1]).toMatchObject({
      method: 'DELETE',
      segments: ['config', 'v1', 'rules', 'my namespace', 'my group'],
    });
  });

  it('sends the rule group as YAML', async () => {
    const { transport, requests } = fakeRulerTransport('config/v1/rules');
    const backend = createVanillaRulerBackend(transport, 'config/v1/rules');

    await backend.upsertRuleGroup('ns', { name: 'group', interval: '5m', rules: [{ alert: 'Up', expr: 'up == 0' }] });

    expect(requests[0].body).toBe(
      ['name: group', 'interval: 5m', 'rules:', '  - alert: Up', '    expr: up == 0', ''].join('\n')
    );
  });

  it('treats an empty body as no config rather than a parse failure', async () => {
    const backend = createVanillaRulerBackend(async () => '   ' as never, 'config/v1/rules');

    expect(await backend.getAllRules()).toEqual({});
    expect(await backend.getRuleGroup('ns', 'group')).toBeNull();
  });
});

describe('vanilla feature discovery', () => {
  const prometheusFlavor = vanillaFlavor({
    promRulesPath: 'api/v1/rules',
    queryPath: 'api/v1/query',
    probeBuildInfo: true,
    applicationWithoutBuildInfo: 'cortex',
    ruler: { path: 'config/v1/rules', probePath: 'api/v1/ruler/test/test' },
  });

  const lokiFlavor = vanillaFlavor({
    promRulesPath: 'prometheus/api/v1/rules',
    queryPath: 'loki/api/v1/query',
    probeBuildInfo: false,
    applicationWithoutBuildInfo: 'loki',
    ruler: { path: 'api/prom/rules', probePath: 'api/prom/rules' },
  });

  /** A backend with no Ruler reachable through the proxy at all. */
  const rulerlessFlavor = vanillaFlavor({
    promRulesPath: 'api/v1/rules',
    queryPath: 'api/v1/query',
    probeBuildInfo: false,
    applicationWithoutBuildInfo: 'cortex',
  });

  /**
   * Answers the probes feature discovery makes, driven by a path -> response map. An unmapped path
   * 404s; wrap a value in `rejectWith` to make that path fail with a specific error instead.
   */
  const rejectWith = (error: unknown) => ({ __reject: error });

  function probeTransport(responses: Record<string, unknown>) {
    const paths: string[] = [];
    const requests: RulerRequest[] = [];
    const transport: RulerTransport = async <T>(request: RulerRequest) => {
      const { segments } = request;
      const path = segments.join('/');
      requests.push(request);
      paths.push(path);

      const response = responses[path];
      if (response === undefined) {
        throw fetchError(404, 'page not found');
      }
      if (typeof response === 'object' && response !== null && '__reject' in response) {
        throw response.__reject;
      }
      return response as T;
    };

    return { transport, paths, requests };
  }

  function ctx(transport: RulerTransport) {
    return { dataSourceUid: 'uid', transport };
  }

  it('reports Mimir when buildinfo advertises features', async () => {
    const { transport } = probeTransport({
      'api/v1/status/buildinfo': {
        status: 'success',
        data: { version: '2.0.0', features: { ruler_config_api: 'true' } },
      },
    });

    expect(await prometheusFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'mimir',
      rulerApiEnabled: true,
    });
  });

  it('reports Mimir without the ruler when the feature is disabled', async () => {
    const { transport } = probeTransport({
      'api/v1/status/buildinfo': {
        status: 'success',
        data: { version: '2.0.0', features: { ruler_config_api: 'false' } },
      },
    });

    expect(await prometheusFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'mimir',
      rulerApiEnabled: false,
    });
  });

  it('reports vanilla Prometheus when buildinfo carries no features', async () => {
    const { transport } = probeTransport({
      'api/v1/status/buildinfo': { status: 'success', data: { version: '2.40.0' } },
    });

    expect(await prometheusFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'prometheus',
      rulerApiEnabled: false,
    });
  });

  it('falls back to Cortex when there is no buildinfo endpoint', async () => {
    const { transport, paths } = probeTransport({
      'api/v1/rules': { status: 'success' },
      'api/v1/ruler/test/test': { status: 'success' },
    });

    expect(await prometheusFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'cortex',
      rulerApiEnabled: true,
    });
    expect(paths).toEqual(['api/v1/status/buildinfo', 'api/v1/rules', 'api/v1/ruler/test/test']);
  });

  it('reports no ruler when the ruler probe fails', async () => {
    const { transport } = probeTransport({ 'api/v1/rules': { status: 'success' } });

    expect(await prometheusFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'cortex',
      rulerApiEnabled: false,
    });
  });

  it('throws when the Prometheus-compatible rules endpoint is unavailable', async () => {
    const { transport } = probeTransport({});

    await expect(prometheusFlavor.discoverFeatures(ctx(transport))).rejects.toThrow(
      'Unable to fetch alert rules. Is the data source properly configured?'
    );
  });

  it('rethrows permission failures rather than reporting a missing feature', async () => {
    const { transport } = probeTransport({ 'api/v1/status/buildinfo': rejectWith(fetchError(403, 'forbidden')) });

    await expect(prometheusFlavor.discoverFeatures(ctx(transport))).rejects.toMatchObject({ status: 403 });
  });

  it('never probes buildinfo for Loki and uses its own paths', async () => {
    const { transport, paths } = probeTransport({
      'prometheus/api/v1/rules': { status: 'success' },
      'api/prom/rules': { status: 'success' },
    });

    expect(await lokiFlavor.discoverFeatures(ctx(transport))).toEqual({
      application: 'loki',
      rulerApiEnabled: true,
    });
    expect(paths).toEqual(['prometheus/api/v1/rules', 'api/prom/rules']);
  });

  // Loki's ruler answers `application/yaml`. Probing it as JSON makes the parse failure look like
  // "no ruler here", which silently turns every Loki rule read-only.
  it('reads probe responses as text so a non-JSON body is not mistaken for a missing endpoint', async () => {
    const { transport, requests } = probeTransport({
      'prometheus/api/v1/rules': { status: 'success' },
      'api/prom/rules': { status: 'success' },
    });

    await lokiFlavor.discoverFeatures(ctx(transport));

    expect(requests.map((request) => request.responseType)).toEqual(['text', 'text']);
  });

  describe('a backend with no reachable Ruler', () => {
    it('reports no ruler without probing for one, and without probing buildinfo', async () => {
      const { transport, paths } = probeTransport({ 'api/v1/rules': { status: 'success' } });

      expect(await rulerlessFlavor.discoverFeatures(ctx(transport))).toEqual({
        application: 'cortex',
        rulerApiEnabled: false,
      });
      expect(paths).toEqual(['api/v1/rules']);
    });

    it('still requires the Prometheus-compatible rules endpoint', async () => {
      const { transport } = probeTransport({});

      await expect(rulerlessFlavor.discoverFeatures(ctx(transport))).rejects.toThrow(
        'Unable to fetch alert rules. Is the data source properly configured?'
      );
    });

    it('throws rather than building unusable URLs if something asks for a Ruler backend', () => {
      const { transport } = probeTransport({});

      expect(() => rulerlessFlavor.createRulerBackend(ctx(transport))).toThrow(
        'no Ruler configuration API reachable through the datasource proxy'
      );
    });
  });
});
