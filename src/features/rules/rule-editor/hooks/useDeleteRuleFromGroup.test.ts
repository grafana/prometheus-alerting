import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { hashRulerRule } from '@grafana/external-rules/hashing';
import { getRuleName } from '@grafana/external-rules/utils';
import { RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { server } from '../../../../test';
import { setMockNamespaces } from '../../../../test/handlers/ruler';
import { createTestWrapper } from '../../../../test/utils/test-wrapper';

import { useDeleteRuleFromGroup } from './useDeleteRuleFromGroup';

const DATA_SOURCE_UID = 'test-mimir-uid';
const NAMESPACE = 'test-namespace';
const GROUP_NAME = 'test-group';

const firstRule = { alert: 'FirstRule', expr: 'up == 0', for: '5m', labels: { severity: 'critical' } };
const secondRule = { alert: 'SecondRule', expr: 'up == 1', for: '5m' };
const recordingRule = { record: 'job:up:sum', expr: 'sum(up)', labels: { aggregation: '5m' } };

function identifierFor(rule: RulerRuleDTO): CloudRuleIdentifier {
  return {
    type: 'cloud',
    uid: DATA_SOURCE_UID,
    namespace: NAMESPACE,
    groupName: GROUP_NAME,
    ruleName: getRuleName(rule),
    rulerRuleHash: hashRulerRule(rule),
  };
}

/** Records the payloads sent to the Ruler API while a test runs */
function captureRulerWrites() {
  const upserts: RulerRuleGroupDTO[] = [];
  const deletes: string[] = [];
  /** Every ruler request in order, so we can assert the read-modify-write sequence */
  const requests: string[] = [];

  server.events.on('request:start', ({ request }) => {
    const { pathname } = new URL(request.url);
    if (pathname.includes('/config/v1/rules')) {
      requests.push(`${request.method} ${pathname}`);
    }
  });

  server.use(
    http.post(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace`, async ({ request }) => {
      upserts.push(yaml.load(await request.text()) as RulerRuleGroupDTO);
      return HttpResponse.json({ status: 'success', data: null });
    }),
    http.delete(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace/:group`, async ({ params }) => {
      deletes.push(String(params.group));
      return HttpResponse.json({ message: 'Rules deleted' }, { status: 202 });
    })
  );

  return { upserts, deletes, requests };
}

function renderDeleteRuleFromGroup() {
  const { result } = renderHook(() => useDeleteRuleFromGroup(), { wrapper: createTestWrapper(DATA_SOURCE_UID) });
  return result;
}

describe('useDeleteRuleFromGroup', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('keeps the other rules in the group when deleting a single rule', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [firstRule, secondRule] }],
    });
    const { upserts, deletes, requests } = captureRulerWrites();

    const result = renderDeleteRuleFromGroup();
    const [deleteRuleFromGroup] = result.current;

    await expect(deleteRuleFromGroup(identifierFor(secondRule))).resolves.toEqual({ groupDeleted: false });

    // The group is rewritten without the deleted rule, and the group itself survives
    expect(upserts).toEqual([{ name: GROUP_NAME, interval: '1m', rules: [firstRule] }]);
    expect(deletes).toEqual([]);

    // The write is always preceded by a read of the latest group definition.
    // A refetch follows, triggered by the write invalidating the RulerRuleGroup cache tag.
    expect(requests.slice(0, 2)).toEqual([
      `GET /api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/${NAMESPACE}/${GROUP_NAME}`,
      `POST /api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/${NAMESPACE}`,
    ]);
  });

  it('deletes the group when the deleted rule was the last one', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [firstRule] }],
    });
    const { upserts, deletes, requests } = captureRulerWrites();

    const result = renderDeleteRuleFromGroup();
    const [deleteRuleFromGroup] = result.current;

    await expect(deleteRuleFromGroup(identifierFor(firstRule))).resolves.toEqual({ groupDeleted: true });

    expect(deletes).toEqual([GROUP_NAME]);
    expect(upserts).toEqual([]);
    expect(requests.slice(0, 2)).toEqual([
      `GET /api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/${NAMESPACE}/${GROUP_NAME}`,
      `DELETE /api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/${NAMESPACE}/${GROUP_NAME}`,
    ]);
  });

  it('deletes a recording rule, keeping the alerting rules', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [firstRule, recordingRule] }],
    });
    const { upserts, deletes } = captureRulerWrites();

    const result = renderDeleteRuleFromGroup();
    const [deleteRuleFromGroup] = result.current;

    await expect(deleteRuleFromGroup(identifierFor(recordingRule))).resolves.toEqual({ groupDeleted: false });

    expect(upserts).toEqual([{ name: GROUP_NAME, interval: '1m', rules: [firstRule] }]);
    expect(deletes).toEqual([]);
  });

  it('deletes the right rule when two rules in the group share a name', async () => {
    // This is the issue-164 repro: duplicating a rule leaves two same-named rules in the
    // group, so the ruler hash is the only thing that tells them apart.
    const original = { alert: 'DuplicatedRule', expr: 'up == 0', for: '5m' };
    const duplicate = { alert: 'DuplicatedRule', expr: 'up == 1', for: '10m' };

    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [original, duplicate] }],
    });
    const { upserts, deletes } = captureRulerWrites();

    const result = renderDeleteRuleFromGroup();
    const [deleteRuleFromGroup] = result.current;

    await expect(deleteRuleFromGroup(identifierFor(duplicate))).resolves.toEqual({ groupDeleted: false });

    expect(upserts).toEqual([{ name: GROUP_NAME, interval: '1m', rules: [original] }]);
    expect(deletes).toEqual([]);
  });

  it('reports the request state of the write, not just the fetch', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [firstRule, secondRule] }],
    });

    const { result } = renderHook(() => useDeleteRuleFromGroup(), { wrapper: createTestWrapper(DATA_SOURCE_UID) });
    expect(result.current[1].isUninitialized).toBe(true);

    await act(async () => {
      await result.current[0](identifierFor(secondRule));
    });

    expect(result.current[1]).toMatchObject({ isLoading: false, isSuccess: true, isError: false });
  });

  it('fails without writing anything when the rule is not in the group', async () => {
    setMockNamespaces({
      [NAMESPACE]: [{ name: GROUP_NAME, interval: '1m', rules: [firstRule] }],
    });
    const { upserts, deletes } = captureRulerWrites();

    const result = renderDeleteRuleFromGroup();
    const [deleteRuleFromGroup] = result.current;

    await expect(deleteRuleFromGroup(identifierFor(secondRule))).rejects.toThrow();

    expect(upserts).toEqual([]);
    expect(deletes).toEqual([]);
  });
});
