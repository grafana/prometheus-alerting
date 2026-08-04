import { PermissionDeniedError, UnsupportedOperationError } from '../../access-control/errors';

import { getReceiverMutationErrorFeedback } from './receiverErrorFeedback';

describe('getReceiverMutationErrorFeedback', () => {
  it.each([new PermissionDeniedError('Denied'), { status: 403, data: { message: 'Forbidden' } }])(
    'returns permission feedback for %p',
    (error) => {
      expect(getReceiverMutationErrorFeedback(error, 'Fallback')).toEqual({
        title: 'Permission denied',
        description: 'You do not have permission to change receivers for this data source.',
      });
    }
  );

  it('returns unsupported feedback', () => {
    expect(getReceiverMutationErrorFeedback(new UnsupportedOperationError('Unsupported'), 'Fallback')).toEqual({
      title: 'Receiver changes unavailable',
      description: 'This Alertmanager does not support updating receivers.',
    });
  });

  it('preserves normal failures', () => {
    expect(getReceiverMutationErrorFeedback(new Error('Network failed'), 'Could not save')).toEqual({
      title: 'Could not save',
      description: 'Network failed',
    });
  });
});
