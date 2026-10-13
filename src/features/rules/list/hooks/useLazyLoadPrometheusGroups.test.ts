import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLazyLoadPrometheusGroups } from './useLazyLoadPrometheusGroups';

describe('useLazyLoadPrometheusGroups', () => {
  // Vitest fails the run on an unhandled rejection, so this also checks that a failed page doesn't leave one behind
  it('keeps a failed page in `error` without leaving the rejection unhandled', async () => {
    const groups = (async function* () {
      throw new Error('boom');
    })();

    const { result } = renderHook(() => useLazyLoadPrometheusGroups(groups, 10));

    await waitFor(() => expect(result.current.error).toEqual(new Error('boom')));
  });

  it('marks groups as received when none pass the filter and a later page fails', async () => {
    const groups = (async function* () {
      yield { name: 'group-a', file: 'namespace', rules: [], interval: 60 };
      throw new Error('boom');
    })();

    const { result } = renderHook(() => useLazyLoadPrometheusGroups(groups, 10, () => false));

    await waitFor(() => expect(result.current.error).toEqual(new Error('boom')));
    expect(result.current.groups).toEqual([]);
    expect(result.current.hasReceivedGroups).toBe(true);
  });
});
