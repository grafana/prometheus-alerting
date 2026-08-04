import { PermissionDeniedError, UnsupportedOperationError } from '../../../access-control/errors';

import { getTemplateMutationErrorFeedback } from './errorFeedback';

describe('getTemplateMutationErrorFeedback', () => {
  it.each([new PermissionDeniedError('Denied'), { status: 403, data: { message: 'Forbidden' } }])(
    'returns permission feedback for %p',
    (error) => {
      expect(getTemplateMutationErrorFeedback(error, 'Fallback')).toEqual({
        title: 'Permission denied',
        description: 'You do not have permission to change templates for this data source.',
      });
    }
  );

  it('returns unsupported feedback', () => {
    expect(getTemplateMutationErrorFeedback(new UnsupportedOperationError('Unsupported'), 'Fallback')).toEqual({
      title: 'Template changes unavailable',
      description: 'This Alertmanager does not support updating templates.',
    });
  });

  it('preserves normal failures', () => {
    expect(getTemplateMutationErrorFeedback(new Error('Network failed'), 'Could not save')).toEqual({
      title: 'Could not save',
      description: 'Network failed',
    });
  });
});
