import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';
import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { hashRulerRule } from '@grafana/external-rules/hashing';
import { getRuleName } from '@grafana/external-rules/utils';
import { RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { server } from '../../../../test';
import { setMockNamespaces } from '../../../../test/handlers/ruler';
import { createMockDataSourceSrv } from '../../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../../test/utils/test-wrapper';

import { isSameRuleLocation, useSaveRuleToGroup } from './useSaveRuleToGroup';

const DATA_SOURCE_UID = 'test-mimir-uid';
const NAMESPACE = 'test-namespace';
const OTHER_NAMESPACE = 'other-namespace';
const GROUP_NAME = 'test-group';
const OTHER_GROUP = 'other-group';

const movedRule = { alert: 'MovedRule', expr: 'up == 0', for: '5m', labels: { severity: 'critical' } };
const stayingRule = { alert: 'StayingRule', expr: 'up == 1', for: '5m' };
const newRule = { alert: 'NewRule', expr: 'up == 2', for: '1m' };

function identifierFor(rule: RulerRuleDTO, namespace = NAMESPACE, groupName = GROUP_NAME): CloudRuleIdentifier {
  return {
    type: 'cloud',
    uid: DATA_SOURCE_UID,
    namespace,
    groupName,
    ruleName: getRuleName(rule),
    rulerRuleHash: hashRulerRule(rule),
  };
}

/** Records the payloads sent to the Ruler API while a test runs */
function captureRulerWrites() {
  const upserts: Array<{ namespace: string; group: RulerRuleGroupDTO }> = [];
  const deletes: string[] = [];
  /** Every ruler request in order, so we can assert the add-then-delete sequence */
  const requests: string[] = [];

  server.events.on('request:start', ({ request }) => {
    const { pathname } = new URL(request.url);
    if (pathname.includes('/config/v1/rules')) {
      requests.push(`${request.method} ${pathname}`);
    }
  });

  server.use(
    http.post(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace`, async ({ request, params }) => {
      upserts.push({
        namespace: String(params.namespace),
        group: yaml.load(await request.text()) as RulerRuleGroupDTO,
      });
      return HttpResponse.json({ status: 'success', data: null });
    }),
    http.delete(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace/:group`, async ({ params }) => {
      deletes.push(`${params.namespace}/${params.group}`);
      return HttpResponse.json({ message: 'Rules deleted' }, { status: 202 });
    })
  );

  return { upserts, deletes, requests };
}

function renderSaveRuleToGroup() {
  const { result } = renderHook(() => useSaveRuleToGroup(), { wrapper: createTestWrapper(DATA_SOURCE_UID) });
  return result;
}

const at = (namespace: string, groupName: string) => ({ uid: DATA_SOURCE_UID, namespace, groupName });

describe('isSameRuleLocation', () => {
  const here = at(NAMESPACE, GROUP_NAME);

  it('matches a location against itself', () => {
    expect(isSameRuleLocation(here, at(NAMESPACE, GROUP_NAME))).toBe(true);
  });

  it('tells apart a different group, namespace or data source', () => {
    expect(isSameRuleLocation(here, at(NAMESPACE, OTHER_GROUP))).toBe(false);
    expect(isSameRuleLocation(here, at(OTHER_NAMESPACE, GROUP_NAME))).toBe(false);
    expect(isSameRuleLocation(here, { ...here, uid: 'other-uid' })).toBe(false);
  });
});

describe('useSaveRuleToGroup', () => {
  beforeEach(() => {
    // The Ruler URL builder resolves the data source type to pick the API base path
    setDataSourceSrv(createMockDataSourceSrv());
  });

  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('adds a new rule to its group', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [stayingRule] }],
    });
    const { upserts, deletes } = captureRulerWrites();

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(result.current[0](at(NAMESPACE, GROUP_NAME), newRule)).resolves.toEqual({ moved: false });
    });

    expect(upserts).toEqual([
      { namespace: NAMESPACE, group: { name: GROUP_NAME, interval: '1m', rules: [stayingRule, newRule] } },
    ]);
    expect(deletes).toEqual([]);
  });

  it('edits a rule in place without touching any other group', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] }],
    });
    const { upserts, deletes } = captureRulerWrites();

    const edited = { ...movedRule, expr: 'up == 99' };
    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(result.current[0](at(NAMESPACE, GROUP_NAME), edited, identifierFor(movedRule))).resolves.toEqual({
        moved: false,
      });
    });

    // Replaced in position, and no delete because nothing moved
    expect(upserts).toEqual([
      { namespace: NAMESPACE, group: { name: GROUP_NAME, interval: '1m', rules: [edited, stayingRule] } },
    ]);
    expect(deletes).toEqual([]);
  });

  it('moves a rule to another group by adding it there first, then removing the original', async () => {
    setMockNamespaces({
      [NAMESPACE]: [
        { name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] },
        { name: OTHER_GROUP, interval: '5m', rules: [newRule] },
      ],
    });
    const { upserts, deletes, requests } = captureRulerWrites();

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(result.current[0](at(NAMESPACE, OTHER_GROUP), movedRule, identifierFor(movedRule))).resolves.toEqual(
        { moved: true }
      );
    });

    // The destination gains the rule and keeps its own interval; the source is rewritten without it
    expect(upserts).toEqual([
      { namespace: NAMESPACE, group: { name: OTHER_GROUP, interval: '5m', rules: [newRule, movedRule] } },
      { namespace: NAMESPACE, group: { name: GROUP_NAME, interval: '1m', rules: [stayingRule] } },
    ]);
    expect(deletes).toEqual([]);

    // The destination is written before the source is touched, so a failure in between leaves a
    // visible duplicate rather than losing the rule
    const writes = requests.filter((request) => !request.startsWith('GET '));
    expect(writes[0]).toBe(`POST /api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/${NAMESPACE}`);
  });

  it('moves a rule to another namespace', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] }],
      [OTHER_NAMESPACE]: [{ name: GROUP_NAME, interval: '5m', rules: [newRule] }],
    });
    const { upserts } = captureRulerWrites();

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(
        result.current[0](at(OTHER_NAMESPACE, GROUP_NAME), movedRule, identifierFor(movedRule))
      ).resolves.toEqual({ moved: true });
    });

    expect(upserts).toEqual([
      { namespace: OTHER_NAMESPACE, group: { name: GROUP_NAME, interval: '5m', rules: [newRule, movedRule] } },
      { namespace: NAMESPACE, group: { name: GROUP_NAME, interval: '1m', rules: [stayingRule] } },
    ]);
  });

  it('moves a rule into a group that does not exist yet', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] }],
    });
    const { upserts } = captureRulerWrites();

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(result.current[0](at(NAMESPACE, OTHER_GROUP), movedRule, identifierFor(movedRule))).resolves.toEqual(
        { moved: true }
      );
    });

    expect(upserts[0]).toMatchObject({ namespace: NAMESPACE, group: { name: OTHER_GROUP, rules: [movedRule] } });
    expect(upserts[1]).toEqual({
      namespace: NAMESPACE,
      group: { name: GROUP_NAME, interval: '1m', rules: [stayingRule] },
    });
  });

  it('deletes the source group when the moved rule was the only one in it', async () => {
    setMockNamespaces({
      [NAMESPACE]: [
        { name: GROUP_NAME, interval: '1m', rules: [movedRule] },
        { name: OTHER_GROUP, interval: '5m', rules: [newRule] },
      ],
    });
    const { upserts, deletes } = captureRulerWrites();

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(result.current[0](at(NAMESPACE, OTHER_GROUP), movedRule, identifierFor(movedRule))).resolves.toEqual(
        { moved: true }
      );
    });

    expect(upserts).toEqual([
      { namespace: NAMESPACE, group: { name: OTHER_GROUP, interval: '5m', rules: [newRule, movedRule] } },
    ]);
    expect(deletes).toEqual([`${NAMESPACE}/${GROUP_NAME}`]);
  });

  it('reports the request state of every write it made', async () => {
    setMockNamespaces({
      [NAMESPACE]: [
        { name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] },
        { name: OTHER_GROUP, interval: '5m', rules: [newRule] },
      ],
    });

    const result = renderSaveRuleToGroup();
    expect(result.current[1].isUninitialized).toBe(true);

    await act(async () => {
      await result.current[0](at(NAMESPACE, OTHER_GROUP), movedRule, identifierFor(movedRule));
    });

    expect(result.current[1]).toMatchObject({ isLoading: false, isSuccess: true, isError: false });
  });

  it('leaves the original alone when writing the destination fails', async () => {
    setMockNamespaces({
      [NAMESPACE]: [
        { name: GROUP_NAME, interval: '1m', rules: [movedRule, stayingRule] },
        { name: OTHER_GROUP, interval: '5m', rules: [newRule] },
      ],
    });
    const { deletes } = captureRulerWrites();
    server.use(
      http.post(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace`, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 })
      )
    );

    const result = renderSaveRuleToGroup();

    await act(async () => {
      await expect(
        result.current[0](at(NAMESPACE, OTHER_GROUP), movedRule, identifierFor(movedRule))
      ).rejects.toBeDefined();
    });

    // The rule is still in its original group -- nothing was removed
    expect(deletes).toEqual([]);
  });
});
