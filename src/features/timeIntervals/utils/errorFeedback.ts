import { t } from '@grafana/i18n';

import { isPermissionDeniedError, isUnsupportedOperationError } from '../../../access-control/errors';
import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface TimeIntervalErrorFeedback {
  title: string;
  description: string;
}

/** Returns user-facing feedback for a failed time interval mutation. */
export function getTimeIntervalMutationErrorFeedback(error: unknown, fallbackTitle: string): TimeIntervalErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return {
      title: t('time-intervals.permission-denied.title', 'Permission denied'),
      description: t(
        'time-intervals.permission-denied.description',
        'You do not have permission to change time intervals for this data source.'
      ),
    };
  }

  if (isUnsupportedOperationError(error)) {
    return {
      title: t('time-intervals.mutation-not-supported.title', 'Time interval changes unavailable'),
      description: t(
        'time-intervals.mutation-not-supported.description',
        'This Alertmanager does not support updating time intervals.'
      ),
    };
  }

  return { title: fallbackTitle, description: extractErrorMessage(error) };
}
