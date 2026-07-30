import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { server } from '../../../test';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

import { useInvalidatePromRules } from './useInvalidatePromRules';

const { useGetGroupsQuery } = prometheusApi;

const DATA_SOURCE_UID = 'test-mimir-uid';

/** Counts requests to the Prometheus rules endpoint, which is what the list views read from */
function countPromRuleRequests() {
  const requests: string[] = [];

  server.events.on('request:start', ({ request }) => {
    const { pathname } = new URL(request.url);
    if (pathname.endsWith('/api/v1/rules')) {
      requests.push(pathname);
    }
  });

  return requests;
}

describe('useInvalidatePromRules', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('refetches Prometheus rules for subscribed views, across the api boundary', async () => {
    const requests = countPromRuleRequests();

    // Stands in for a list view reading Prometheus rules while something else writes via the Ruler API
    const { result } = renderHook(
      () => ({
        query: useGetGroupsQuery({ ruleSource: { uid: DATA_SOURCE_UID } }),
        invalidate: useInvalidatePromRules(),
      }),
      { wrapper: createTestWrapper(DATA_SOURCE_UID) }
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(requests).toHaveLength(1);

    act(() => {
      result.current.invalidate();
    });

    // The Rules tag lives in prometheusApi, which no mutation can invalidate on its own
    await waitFor(() => expect(requests).toHaveLength(2));
  });
});
