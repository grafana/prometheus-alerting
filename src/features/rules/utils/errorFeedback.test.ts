import { getRulesErrorFeedback } from './errorFeedback';

describe('getRulesErrorFeedback', () => {
  it('returns permission feedback for forbidden requests', () => {
    expect(getRulesErrorFeedback({ status: 403, data: {} })).toEqual({
      description: 'You do not have permission to access rules from this data source.',
      status: 'HTTP 403',
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

  it('reports the status and the failing request', () => {
    const feedback = getRulesErrorFeedback({
      status: 502,
      statusText: 'Bad Gateway',
      data: { message: 'Bad Gateway' },
      url: '/api/datasources/proxy/uid/abc/api/v1/rules',
    });

    expect(feedback).toMatchObject({
      status: 'HTTP 502 Bad Gateway',
      url: '/api/datasources/proxy/uid/abc/api/v1/rules',
    });
  });

  it('reads the failing request off the original fetch config', () => {
    const feedback = getRulesErrorFeedback({
      status: 500,
      data: {},
      config: { url: '/api/datasources/proxy/uid/abc/api/v1/status/buildinfo' },
    });

    expect(feedback.url).toBe('/api/datasources/proxy/uid/abc/api/v1/status/buildinfo');
  });

  it('describes non-HTTP failures by their status string', () => {
    const feedback = getRulesErrorFeedback({ status: 'FETCH_ERROR', error: 'Failed to fetch' });

    expect(feedback).toMatchObject({ description: 'Failed to fetch', status: 'FETCH_ERROR' });
  });

  it('leaves out the CUSTOM_ERROR status, it says nothing about what went wrong', () => {
    const feedback = getRulesErrorFeedback({
      status: 'CUSTOM_ERROR',
      error: 'JSON.parse: unexpected character at line 1 column 1 of the JSON data',
    });

    expect(feedback).toMatchObject({
      description: 'JSON.parse: unexpected character at line 1 column 1 of the JSON data',
      status: undefined,
    });
  });

  it('describes thrown errors by their message', () => {
    const feedback = getRulesErrorFeedback(new Error('Data source with uid "abc" not found'));

    expect(feedback).toMatchObject({
      description: 'Data source with uid "abc" not found',
      status: undefined,
      url: undefined,
    });
  });

  it('returns the ruler response verbatim, without stripping or splitting anything', () => {
    const message =
      '10:13: group "g", rule 1, "a": invalid recording rule name: a, 14:9: group "g", rule 2, "b": invalid label name: b';

    expect(getRulesErrorFeedback({ status: 400, data: message }).description).toBe(message);
  });

  it('trims surrounding whitespace but leaves the message otherwise untouched', () => {
    const feedback = getRulesErrorFeedback({ status: 400, data: '  ruler API is not enabled  \n' });

    expect(feedback.description).toBe('ruler API is not enabled');
  });

  it('falls back to an unknown-error message when there is nothing to show', () => {
    expect(getRulesErrorFeedback(new Error('')).description).toBe('An unknown error occurred');
  });
});
