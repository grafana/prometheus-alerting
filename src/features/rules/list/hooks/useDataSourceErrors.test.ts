import { DataSourceRulesError, dataSourceErrorsReducer } from './useDataSourceErrors';

const promError: DataSourceRulesError = {
  uid: 'prom',
  kind: 'error',
  description: 'Bad Gateway',
};

const mimirError: DataSourceRulesError = {
  uid: 'mimir',
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

  it('replaces an error when the data source turns out to be empty instead', () => {
    const state = dataSourceErrorsReducer({}, { type: 'report', error: promError });
    const next = dataSourceErrorsReducer(state, { type: 'report', error: { ...promError, kind: 'empty' } });

    expect(next.prom.kind).toBe('empty');
  });

  it('clears a single data source', () => {
    expect(dataSourceErrorsReducer(bothReported(), { type: 'clear', uid: 'prom' })).toEqual({ mimir: mimirError });
  });

  it('only clears a report of the given kind', () => {
    const state = bothReported();

    expect(dataSourceErrorsReducer(state, { type: 'clear', uid: 'prom', kind: 'empty' })).toBe(state);
    expect(dataSourceErrorsReducer(state, { type: 'clear', uid: 'prom', kind: 'error' })).toEqual({
      mimir: mimirError,
    });
  });
});
