import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { server } from '../../../test';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

import { useInvalidatePromRules } from './useInvalidatePromRules';

const { useGetGroupsQuery } = prometheusApi;

const MIMIR_UID = 'test-mimir-uid';
const PROMETHEUS_UID = 'prometheus-1';

/** Counts requests to the Prometheus rules endpoint per data source, which is what the list views read from */
function countPromRuleRequests() {
  const requests: string[] = [];

  server.events.on('request:start', ({ request }) => {
    const { pathname } = new URL(request.url);
    if (pathname.endsWith('/api/v1/rules')) {
      requests.push(pathname);
    }
  });

  const countFor = (uid: string) => requests.filter((pathname) => pathname.includes(`/uid/${uid}/`)).length;

  return { countFor };
}

/** Stands in for two list views, each reading the rules of a different data source */
function renderSubscribedViews() {
  const { result } = renderHook(
    () => ({
      mimir: useGetGroupsQuery({ ruleSource: { uid: MIMIR_UID } }),
      prometheus: useGetGroupsQuery({ ruleSource: { uid: PROMETHEUS_UID } }),
      invalidate: useInvalidatePromRules(),
    }),
    { wrapper: createTestWrapper(MIMIR_UID) }
  );

  return result;
}

describe('useInvalidatePromRules', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('refetches Prometheus rules for the given data source, across the api boundary', async () => {
    const { countFor } = countPromRuleRequests();

    const result = renderSubscribedViews();

    await waitFor(() => expect(result.current.mimir.isSuccess).toBe(true));
    expect(countFor(MIMIR_UID)).toBe(1);

    act(() => {
      result.current.invalidate(MIMIR_UID);
    });

    // The Rules tag lives in prometheusApi, which no ruler mutation can invalidate on its own
    await waitFor(() => expect(countFor(MIMIR_UID)).toBe(2));
  });

  it('leaves the cached rules of other data sources alone', async () => {
    const { countFor } = countPromRuleRequests();

    const result = renderSubscribedViews();

    await waitFor(() => expect(result.current.prometheus.isSuccess).toBe(true));
    expect(countFor(PROMETHEUS_UID)).toBe(1);

    act(() => {
      result.current.invalidate(MIMIR_UID);
    });

    await waitFor(() => expect(countFor(MIMIR_UID)).toBe(2));
    expect(countFor(PROMETHEUS_UID)).toBe(1);
  });
});
