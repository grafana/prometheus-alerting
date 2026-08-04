import { PermissionDeniedError, UnsupportedOperationError } from '../../../access-control/errors';

import { getTimeIntervalMutationErrorFeedback } from './errorFeedback';

describe('getTimeIntervalMutationErrorFeedback', () => {
  it.each([new PermissionDeniedError('Denied'), { status: 403, data: { message: 'Forbidden' } }])(
    'returns permission feedback for %p',
    (error) => {
      expect(getTimeIntervalMutationErrorFeedback(error, 'Fallback')).toEqual({
        title: 'Permission denied',
        description: 'You do not have permission to change time intervals for this data source.',
      });
    }
  );

  it('returns unsupported feedback', () => {
    expect(getTimeIntervalMutationErrorFeedback(new UnsupportedOperationError('Unsupported'), 'Fallback')).toEqual({
      title: 'Time interval changes unavailable',
      description: 'This Alertmanager does not support updating time intervals.',
    });
  });

  it('preserves normal failures', () => {
    expect(getTimeIntervalMutationErrorFeedback(new Error('Network failed'), 'Could not save')).toEqual({
      title: 'Could not save',
      description: 'Network failed',
    });
  });
});
