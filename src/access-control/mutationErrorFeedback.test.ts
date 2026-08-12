import { PermissionDeniedError, UnsupportedOperationError } from './errors';
import { getMutationErrorFeedback } from './mutationErrorFeedback';

describe('getMutationErrorFeedback', () => {
  it.each([new PermissionDeniedError('Denied'), { status: 403, data: { message: 'Forbidden' } }])(
    'returns permission feedback for %p',
    (error) => {
      expect(getMutationErrorFeedback(error, { fallbackTitle: 'Fallback', resource: 'receivers' })).toEqual({
        title: 'Permission denied',
        description: 'You do not have permission to change receivers for this data source.',
      });
    }
  );

  it('returns unsupported feedback', () => {
    expect(
      getMutationErrorFeedback(new UnsupportedOperationError('Unsupported'), {
        fallbackTitle: 'Fallback',
        resource: 'templates',
      })
    ).toEqual({
      title: 'Configuration changes unavailable',
      description: 'This Alertmanager does not support updating templates.',
    });
  });

  it('preserves normal failures', () => {
    expect(
      getMutationErrorFeedback(new Error('Network failed'), { fallbackTitle: 'Could not save', resource: 'routes' })
    ).toEqual({
      title: 'Could not save',
      description: 'Network failed',
    });
  });
});
