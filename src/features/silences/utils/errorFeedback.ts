import { t } from '@grafana/i18n';

import { isPermissionDeniedError } from '../../../access-control/errors';
import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface SilenceErrorFeedback {
  title: string;
  description: string;
}

/** Returns user-facing feedback for a failed silence mutation. */
export function getSilenceMutationErrorFeedback(error: unknown, fallbackTitle: string): SilenceErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return {
      title: t('silences.permission-denied.title', 'Permission denied'),
      description: t(
        'silences.permission-denied.description',
        'You do not have permission to change silences for this data source.'
      ),
    };
  }

  return {
    title: fallbackTitle,
    description: extractErrorMessage(error),
  };
}
