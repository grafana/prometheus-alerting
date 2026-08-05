import { getRulesErrorFeedback } from './errorFeedback';

describe('getRulesErrorFeedback', () => {
  it('returns permission feedback for forbidden requests', () => {
    expect(getRulesErrorFeedback({ status: 403, data: {} })).toEqual({
      description: 'You do not have permission to access rules from this data source.',
      details: 'HTTP 403',
    });
  });

  it('reports the underlying cause rather than the generic wrapping message', () => {
    const feedback = getRulesErrorFeedback({
      status: 502,
      data: { message: 'Bad Gateway', error: 'dial tcp 10.0.0.5:9090: connect: connection refused' },
    });

    expect(feedback.description).toBe('dial tcp 10.0.0.5:9090: connect: connection refused');
  });

  it('falls back to the message when there is no separate cause', () => {
    const feedback = getRulesErrorFeedback({ status: 502, data: { message: 'Bad Gateway' } });

    expect(feedback.description).toBe('Bad Gateway');
  });

  it('reports the cause when it is the only message', () => {
    const feedback = getRulesErrorFeedback({ status: 400, data: { error: 'bad_data: invalid parameter' } });

    expect(feedback.description).toBe('bad_data: invalid parameter');
  });

  it('falls back to the status line when the response has no body', () => {
    expect(getRulesErrorFeedback({ status: 502, statusText: 'Bad Gateway', data: {} }).description).toBe(
      'HTTP 502 Bad Gateway'
    );
  });

  it('reports the status and the failing request as details', () => {
    const feedback = getRulesErrorFeedback({
      status: 502,
      statusText: 'Bad Gateway',
      data: { message: 'Bad Gateway' },
      url: '/api/datasources/proxy/uid/abc/api/v1/rules',
    });

    expect(feedback.details).toBe('HTTP 502 Bad Gateway · /api/datasources/proxy/uid/abc/api/v1/rules');
  });

  it('reads the failing request off the original fetch config', () => {
    const feedback = getRulesErrorFeedback({
      status: 500,
      data: {},
      config: { url: '/api/datasources/proxy/uid/abc/api/v1/status/buildinfo' },
    });

    expect(feedback.details).toBe('HTTP 500 · /api/datasources/proxy/uid/abc/api/v1/status/buildinfo');
  });

  it('describes non-HTTP failures by their status string', () => {
    const feedback = getRulesErrorFeedback({ status: 'FETCH_ERROR', error: 'Failed to fetch' });

    expect(feedback).toMatchObject({ description: 'Failed to fetch', details: 'FETCH_ERROR' });
  });

  it('describes thrown errors by their message', () => {
    const feedback = getRulesErrorFeedback(new Error('Data source with uid "abc" not found'));

    expect(feedback).toMatchObject({ description: 'Data source with uid "abc" not found', details: undefined });
  });
});
