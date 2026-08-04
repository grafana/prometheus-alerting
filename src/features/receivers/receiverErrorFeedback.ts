import { t } from '@grafana/i18n';

import { isPermissionDeniedError, isUnsupportedOperationError } from '../../access-control/errors';
import { extractErrorMessage, isForbiddenError } from '../../utils/errors';

export interface ReceiverErrorFeedback {
  title: string;
  description: string;
}

/** Returns user-facing feedback for a failed receiver mutation. */
export function getReceiverMutationErrorFeedback(error: unknown, fallbackTitle: string): ReceiverErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return {
      title: t('receivers.permission-denied.title', 'Permission denied'),
      description: t(
        'receivers.permission-denied.description',
        'You do not have permission to change receivers for this data source.'
      ),
    };
  }

  if (isUnsupportedOperationError(error)) {
    return {
      title: t('receivers.mutation-not-supported.title', 'Receiver changes unavailable'),
      description: t(
        'receivers.mutation-not-supported.description',
        'This Alertmanager does not support updating receivers.'
      ),
    };
  }

  return { title: fallbackTitle, description: extractErrorMessage(error) };
}
