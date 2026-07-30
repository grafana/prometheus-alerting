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
});
