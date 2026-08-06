import { PermissionDeniedError } from '../../../access-control/errors';
import { getSilenceMutationErrorFeedback } from './errorFeedback';

describe('getSilenceMutationErrorFeedback', () => {
  it('reports permission feedback for a locally denied mutation', () => {
    const feedback = getSilenceMutationErrorFeedback(new PermissionDeniedError('nope'), 'Failed to create silence');

    expect(feedback).toEqual({
      title: 'Permission denied',
      description: 'You do not have permission to change silences for this data source.',
    });
  });

  it('reports permission feedback for a forbidden datasource response', () => {
    const feedback = getSilenceMutationErrorFeedback({ status: 403, data: {} }, 'Failed to create silence');

    expect(feedback.title).toBe('Permission denied');
  });

  it('falls back to the caller title and the error message for other failures', () => {
    const feedback = getSilenceMutationErrorFeedback(new Error('boom'), 'Failed to create silence');

    expect(feedback).toEqual({
      title: 'Failed to create silence',
      description: 'boom',
    });
  });
});
