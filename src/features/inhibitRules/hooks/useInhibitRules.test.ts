import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { YamlToParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';

import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { basicConfig, configWithInhibitRules } from '../../../test/fixtures/alertmanager-config';
import { setVanillaAlertmanagerConfig } from '../../../test/handlers/alertmanager';
import { useInhibitRules, useAddInhibitRule, useUpdateInhibitRule, useDeleteInhibitRule } from './useInhibitRules';

// Hoisted top-level mock — applies to all tests in this file.
// Individual tests can override the return value with vi.mocked(...).mockReturnValueOnce().
vi.mock('../../../hooks/useAlertmanager', () => ({
  useAlertmanager: vi.fn(() => ({
    uid: 'test-mimir-uid',
    settings: { jsonData: { implementation: 'mimir' } } as any,
  })),
}));

// Import after vi.mock so we get the mocked version
import { useAlertmanager } from '../../../hooks/useAlertmanager';

afterEach(() => {
  // Restore the default Mimir implementation after each test
  // (mockReturnValueOnce in individual tests leaves the queue empty after one use)
  vi.mocked(useAlertmanager).mockImplementation(() => ({
    uid: 'test-mimir-uid',
    settings: { jsonData: { implementation: 'mimir' } } as any,
  }));
});

// ─── shared MSW helpers ──────────────────────────────────────────────────────

function serveMimirConfig(config: typeof basicConfig) {
  server.use(
    http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () =>
      HttpResponse.text(YamlToParsedUserConfiguration.encode(config))
    )
  );
}

function interceptMimirPost(cb: (yaml: string) => void) {
  server.use(
    http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
      cb(await request.text());
      return HttpResponse.json({ status: 'success' });
    })
  );
}

// ─── useInhibitRules ─────────────────────────────────────────────────────────

describe('useInhibitRules', () => {
  it('returns normalised inhibit rules for a Mimir datasource', async () => {
    serveMimirConfig(configWithInhibitRules);

    const { result } = renderHook(() => useInhibitRules(), { wrapper: createTestWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.inhibitRules).toHaveLength(2);
    // matchers are normalised from strings to ObjectMatcher tuples
    expect(result.current.inhibitRules[0].source_matchers).toEqual([['severity', '=', 'critical']]);
    expect(result.current.inhibitRules[0].target_matchers).toEqual([['severity', '=', 'warning']]);
    expect(result.current.inhibitRules[0].equal).toEqual(['alertname', 'instance']);
    // second rule uses multiple matchers
    expect(result.current.inhibitRules[1].source_matchers).toEqual([
      ['team', '=', 'ops'],
      ['severity', '=', 'critical'],
    ]);
    expect(result.current.inhibitRules[1].equal).toEqual(['namespace']);
  });

  it('returns an empty array when there are no inhibit rules', async () => {
    serveMimirConfig(basicConfig);

    const { result } = renderHook(() => useInhibitRules(), { wrapper: createTestWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.inhibitRules).toEqual([]);
  });

  it('returns normalised inhibit rules for a vanilla Alertmanager datasource', async () => {
    // Override for this test only: use vanilla Alertmanager.
    // Use mockReturnValue (not Once) so all re-renders triggered by RTK Query state
    // changes get the vanilla config. The afterEach restores the default Mimir impl.
    vi.mocked(useAlertmanager).mockReturnValue({
      uid: 'alertmanager-1',
      settings: { jsonData: { implementation: 'prometheus' } } as any,
    });

    setVanillaAlertmanagerConfig({
      receivers: [{ name: 'default' }],
      inhibit_rules: [
        { source_matchers: ['severity=critical'], target_matchers: ['severity=warning'], equal: ['alertname'] },
      ],
    });

    const { result } = renderHook(() => useInhibitRules(), {
      wrapper: createTestWrapper('alertmanager-1'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.inhibitRules).toHaveLength(1);
    expect(result.current.inhibitRules[0].source_matchers).toEqual([['severity', '=', 'critical']]);
    expect(result.current.inhibitRules[0].target_matchers).toEqual([['severity', '=', 'warning']]);
    expect(result.current.inhibitRules[0].equal).toEqual(['alertname']);
  });
});

// ─── useAddInhibitRule ───────────────────────────────────────────────────────

describe('useAddInhibitRule', () => {
  it('appends the new rule to the existing rules in the POSTed config', async () => {
    serveMimirConfig(configWithInhibitRules);

    const newRule = {
      source_matchers: ['alertname = ClusterDown'],
      target_matchers: ['team = platform'],
      equal: ['cluster'],
    };

    let postedConfig: ReturnType<typeof YamlToParsedUserConfiguration.decode> | undefined;
    interceptMimirPost((yaml) => {
      postedConfig = YamlToParsedUserConfiguration.decode(yaml);
    });

    const { result } = renderHook(() => useAddInhibitRule(), { wrapper: createTestWrapper() });
    const [addInhibitRule] = result.current;

    await act(async () => {
      await addInhibitRule(newRule);
    });

    await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

    expect(postedConfig?.alertmanager_config.inhibit_rules).toHaveLength(3);
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[2]).toMatchObject(newRule);
  });

  it('preserves existing rules when adding a new one', async () => {
    serveMimirConfig(configWithInhibitRules);

    let postedConfig: ReturnType<typeof YamlToParsedUserConfiguration.decode> | undefined;
    interceptMimirPost((yaml) => {
      postedConfig = YamlToParsedUserConfiguration.decode(yaml);
    });

    const { result } = renderHook(() => useAddInhibitRule(), { wrapper: createTestWrapper() });
    await act(async () => {
      await result.current[0]({ source_matchers: ['a = b'], target_matchers: ['c = d'] });
    });

    await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

    // Original two rules are intact
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[0]).toMatchObject(
      configWithInhibitRules.alertmanager_config.inhibit_rules![0]
    );
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[1]).toMatchObject(
      configWithInhibitRules.alertmanager_config.inhibit_rules![1]
    );
  });
});

// ─── useUpdateInhibitRule ────────────────────────────────────────────────────

describe('useUpdateInhibitRule', () => {
  it('replaces the rule at the given index in the POSTed config', async () => {
    serveMimirConfig(configWithInhibitRules);

    const updatedRule = {
      source_matchers: ['severity = critical'],
      target_matchers: ['severity = info'],
      equal: ['job'],
    };

    let postedConfig: ReturnType<typeof YamlToParsedUserConfiguration.decode> | undefined;
    interceptMimirPost((yaml) => {
      postedConfig = YamlToParsedUserConfiguration.decode(yaml);
    });

    const { result } = renderHook(() => useUpdateInhibitRule(), { wrapper: createTestWrapper() });
    await act(async () => {
      await result.current[0](updatedRule, 0);
    });

    await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

    expect(postedConfig?.alertmanager_config.inhibit_rules).toHaveLength(2);
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[0]).toMatchObject(updatedRule);
    // index 1 is unchanged
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[1]).toMatchObject(
      configWithInhibitRules.alertmanager_config.inhibit_rules![1]
    );
  });
  // Out-of-bounds error propagation is already tested at the reducer level
  // (inhibitRules.test.ts) and does not need to be repeated here.
});

// ─── useDeleteInhibitRule ────────────────────────────────────────────────────

describe('useDeleteInhibitRule', () => {
  it('removes the rule at the given index in the POSTed config', async () => {
    serveMimirConfig(configWithInhibitRules);

    let postedConfig: ReturnType<typeof YamlToParsedUserConfiguration.decode> | undefined;
    interceptMimirPost((yaml) => {
      postedConfig = YamlToParsedUserConfiguration.decode(yaml);
    });

    const { result } = renderHook(() => useDeleteInhibitRule(), { wrapper: createTestWrapper() });
    await act(async () => {
      await result.current[0](0);
    });

    await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

    expect(postedConfig?.alertmanager_config.inhibit_rules).toHaveLength(1);
    // The surviving rule is the former index 1
    expect(postedConfig?.alertmanager_config.inhibit_rules?.[0]).toMatchObject(
      configWithInhibitRules.alertmanager_config.inhibit_rules![1]
    );
  });
  // Out-of-bounds error propagation is already tested at the reducer level
  // (inhibitRules.test.ts) and does not need to be repeated here.
});
