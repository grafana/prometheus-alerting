import { DataSourceRulesError, dataSourceErrorsReducer, loadingReducer } from './useDataSourceErrors';

const promError: DataSourceRulesError = {
  uid: 'prom',
  name: 'Prometheus',
  kind: 'error',
  description: 'Bad Gateway',
};

const mimirError: DataSourceRulesError = {
  uid: 'mimir',
  name: 'Mimir',
  kind: 'error',
  description: 'Not allowed',
};

/** Reports both fixtures, the starting point of most cases below */
function bothReported() {
  return dataSourceErrorsReducer(dataSourceErrorsReducer({}, { type: 'report', error: promError }), {
    type: 'report',
    error: mimirError,
  });
}

describe('dataSourceErrorsReducer', () => {
  it('reports errors per data source', () => {
    expect(bothReported()).toEqual({ prom: promError, mimir: mimirError });
  });

  it('keeps the same state when the same error is reported again', () => {
    const state = dataSourceErrorsReducer({}, { type: 'report', error: promError });

    expect(dataSourceErrorsReducer(state, { type: 'report', error: { ...promError } })).toBe(state);
  });

  it('replaces an error when its feedback changed', () => {
    const state = dataSourceErrorsReducer({}, { type: 'report', error: promError });
    const next = dataSourceErrorsReducer(state, {
      type: 'report',
      error: { ...promError, details: 'HTTP 502 Bad Gateway' },
    });

    expect(next.prom.details).toBe('HTTP 502 Bad Gateway');
  });

  it('replaces an error when the data source turns out to be empty instead', () => {
    const state = dataSourceErrorsReducer({}, { type: 'report', error: promError });
    const next = dataSourceErrorsReducer(state, { type: 'report', error: { ...promError, kind: 'empty' } });

    expect(next.prom.kind).toBe('empty');
  });

  it('clears a single data source', () => {
    expect(dataSourceErrorsReducer(bothReported(), { type: 'clear', uid: 'prom' })).toEqual({ mimir: mimirError });
  });

  it('keeps the same state when clearing an unknown data source', () => {
    const state = bothReported();

    expect(dataSourceErrorsReducer(state, { type: 'clear', uid: 'unknown' })).toBe(state);
  });

  it('clears every data source', () => {
    expect(dataSourceErrorsReducer(bothReported(), { type: 'clear-all' })).toEqual({});
  });

  it('keeps an already empty state when clearing', () => {
    const empty = {};

    expect(dataSourceErrorsReducer(empty, { type: 'clear-all' })).toBe(empty);
  });
});

describe('loadingReducer', () => {
  it('keeps a data source loading until every component that started loading it has stopped', () => {
    const twice = loadingReducer(loadingReducer({}, { type: 'start', uid: 'prom' }), { type: 'start', uid: 'prom' });
    const once = loadingReducer(twice, { type: 'stop', uid: 'prom' });

    expect(once).toEqual({ prom: 1 });
    expect(loadingReducer(once, { type: 'stop', uid: 'prom' })).toEqual({});
  });

  it('keeps the same state when stopping a data source that is not loading', () => {
    const empty = {};

    expect(loadingReducer(empty, { type: 'stop', uid: 'prom' })).toBe(empty);
  });
});
