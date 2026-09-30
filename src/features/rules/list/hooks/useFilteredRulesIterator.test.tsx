import React, { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toArray } from 'ix/asynciterable';
import { describe, expect, it, vi } from 'vitest';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { DataSourceRulesSourceIdentifier } from '../../../../types/rules';

import { DataSourceErrorsProvider, useDataSourceErrors } from './useDataSourceErrors';
import { useFilteredRulesIteratorProvider } from './useFilteredRulesIterator';

const prometheus: DataSourceRulesSourceIdentifier = { uid: 'prom', name: 'Prometheus', ruleSourceType: 'datasource' };

vi.mock('../../../../utils/datasource', () => ({
  getExternalRulesSources: () => [prometheus],
}));

const groupsGenerator = vi.fn<() => AsyncGenerator<PromRuleGroupDTO[], void, unknown>>();

vi.mock('./prometheusGroupsGenerator', () => ({
  usePrometheusGroupsGenerator: () => groupsGenerator,
}));

function wrapper({ children }: PropsWithChildren) {
  return <DataSourceErrorsProvider>{children}</DataSourceErrorsProvider>;
}

function renderIteratorProvider() {
  return renderHook(() => ({ getIterable: useFilteredRulesIteratorProvider(), ...useDataSourceErrors() }), {
    wrapper,
  });
}

describe('useFilteredRulesIteratorProvider', () => {
  it('reports a data source that fails', async () => {
    groupsGenerator.mockImplementation(async function* () {
      throw { status: 500, data: { message: 'connection refused' } };
    });
    const { result } = renderIteratorProvider();

    const { iterable } = result.current.getIterable({}, 10);
    await toArray(iterable);

    await waitFor(() => expect(result.current.errors).toHaveLength(1));
    expect(result.current.errors[0]).toMatchObject({ uid: 'prom', description: 'connection refused' });
  });

  it('does not report data sources that were still loading when the search was stopped', async () => {
    // The request only comes back after we stopped the search, which is when the stream notices the abort
    let respond = () => {};
    const response = new Promise<void>((resolve) => (respond = resolve));
    groupsGenerator.mockImplementation(async function* () {
      await response;
      yield [];
    });
    const { result } = renderIteratorProvider();

    await act(async () => {
      const { iterable, abortController } = result.current.getIterable({}, 10);
      const done = toArray(iterable);
      abortController.abort();
      respond();
      await done;
    });

    expect(result.current.errors).toEqual([]);
  });
});
