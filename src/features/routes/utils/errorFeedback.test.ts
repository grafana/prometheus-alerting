import { PermissionDeniedError, UnsupportedOperationError } from '../../../access-control/errors';
import { getRouteMutationErrorFeedback } from './errorFeedback';

describe('route error feedback', () => {
  it.each([new PermissionDeniedError('Insufficient permissions'), { status: 403, data: { message: 'Forbidden' } }])(
    'shows permission feedback for local denials and datasource 403s',
    (error) => {
      expect(getRouteMutationErrorFeedback(error, 'Failed to update route')).toEqual({
        title: 'Permission denied',
        description: 'You do not have permission to change routes for this data source.',
      });
    }
  );

  it('shows unavailable feedback for unsupported configuration mutations', () => {
    expect(
      getRouteMutationErrorFeedback(
        new UnsupportedOperationError('Configuration updates are unsupported'),
        'Failed to update route'
      )
    ).toEqual({
      title: 'Route changes unavailable',
      description: 'This Alertmanager does not support updating routes.',
    });
  });

  it('preserves existing feedback for non-permission request failures', () => {
    expect(
      getRouteMutationErrorFeedback({ status: 500, data: { message: 'Request failed' } }, 'Failed to update route')
    ).toEqual({
      title: 'Failed to update route',
      description: 'Request failed',
    });
  });
});
