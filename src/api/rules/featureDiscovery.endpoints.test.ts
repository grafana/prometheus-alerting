import { toFeatureDiscoveryError } from './featureDiscovery.endpoints';

describe('toFeatureDiscoveryError', () => {
  it('preserves an HTTP 403 status and response data', () => {
    const error = {
      status: 403,
      data: { message: 'Access denied' },
    };

    expect(toFeatureDiscoveryError(error)).toEqual({
      status: 403,
      data: { message: 'Access denied' },
    });
  });

  it('keeps the request context needed to explain an opaque gateway failure', () => {
    const error = {
      status: 502,
      statusText: 'Bad Gateway',
      data: { message: 'Bad Gateway' },
      config: { url: '/api/datasources/proxy/uid/abc/api/v1/status/buildinfo' },
    };

    expect(toFeatureDiscoveryError(error)).toEqual({
      status: 502,
      data: { message: 'Bad Gateway' },
      statusText: 'Bad Gateway',
      url: '/api/datasources/proxy/uid/abc/api/v1/status/buildinfo',
    });
  });
});
