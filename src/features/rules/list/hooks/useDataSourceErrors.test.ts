import { DataSourceRulesError, dataSourceErrorsReducer } from './useDataSourceErrors';

const promError: DataSourceRulesError = {
  uid: 'prom',
  name: 'Prometheus',
  description: 'Bad Gateway',
};

const mimirError: DataSourceRulesError = {
  uid: 'mimir',
  name: 'Mimir',
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
