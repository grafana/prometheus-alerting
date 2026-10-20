import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromRuleGroupFactory } from '../../mocks/rules.fakes';

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

  it('remembers that groups came in even when none of them match the filter', async () => {
    const groups = (async function* () {
      yield PromRuleGroupFactory.build();
    })();

    const { result } = renderHook(() => useLazyLoadPrometheusGroups(groups, 10, () => false));

    await waitFor(() => expect(result.current.hasMoreGroups).toBe(false));
    expect(result.current.groups).toEqual([]);
    expect(result.current.hasReceivedGroups).toBe(true);
  });
});
