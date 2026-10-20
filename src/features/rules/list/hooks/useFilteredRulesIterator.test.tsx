import { renderHook } from '@testing-library/react';
import { toArray } from 'ix/asynciterable';
import { describe, expect, it, vi } from 'vitest';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { DataSourceRulesSourceIdentifier } from '../../../../types/rules';
import { PromRuleGroupFactory } from '../../mocks/rules.fakes';

import { useFilteredRulesIteratorProvider } from './useFilteredRulesIterator';

const prometheus: DataSourceRulesSourceIdentifier = { uid: 'prom', name: 'Prometheus' };

vi.mock('../../../../utils/datasource', () => ({
  getExternalRulesSources: () => [prometheus],
}));

const groupsGenerator = vi.fn<() => AsyncGenerator<PromRuleGroupDTO[], void, unknown>>();

vi.mock('./prometheusGroupsGenerator', () => ({
  usePrometheusGroupsGenerator: () => groupsGenerator,
}));

function renderIteratorProvider() {
  return renderHook(() => useFilteredRulesIteratorProvider()).result.current;
}

const failure = { status: 500, data: { message: 'connection refused' } };

describe('useFilteredRulesIteratorProvider', () => {
  it('hands every page to the caller before filtering it', async () => {
    const groups = PromRuleGroupFactory.buildList(1);
    groupsGenerator.mockImplementation(async function* () {
      yield groups;
    });
    const onDataSourceResponse = vi.fn();

    const { iterable } = renderIteratorProvider()({ ruleName: 'does not match' }, 10, { onDataSourceResponse });

    expect(await toArray(iterable)).toEqual([]);
    expect(onDataSourceResponse).toHaveBeenCalledWith('prom', groups);
  });

  it('tells the caller whether a failing data source served rules before', async () => {
    groupsGenerator.mockImplementation(async function* () {
      yield PromRuleGroupFactory.buildList(1);
      throw failure;
    });
    const onDataSourceError = vi.fn();

    await toArray(renderIteratorProvider()({}, 10, { onDataSourceError }).iterable);

    expect(onDataSourceError).toHaveBeenCalledWith('prom', failure, { servedRules: true });
  });

  it('does not report data sources that were still loading when the search was stopped', async () => {
    // The request only comes back after we stopped the search, which is when the stream notices the abort
    let respond = () => {};
    const response = new Promise<void>((resolve) => (respond = resolve));
    groupsGenerator.mockImplementation(async function* () {
      await response;
      yield [];
    });
    const onDataSourceError = vi.fn();

    const { iterable, abortController } = renderIteratorProvider()({}, 10, { onDataSourceError });
    const done = toArray(iterable);
    abortController.abort();
    respond();
    await done.catch(() => {});

    expect(onDataSourceError).not.toHaveBeenCalled();
  });
});
