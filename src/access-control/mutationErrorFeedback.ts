import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../utils/errors';
import { isPermissionDeniedError, isUnsupportedOperationError } from './errors';

export interface MutationErrorFeedback {
  title: string;
  description: string;
}

interface MutationErrorFeedbackOptions {
  fallbackTitle: string;
  resource: string;
}

/** Returns consistent user-facing feedback for failed Alertmanager configuration mutations. */
export function getMutationErrorFeedback(
  error: unknown,
  { fallbackTitle, resource }: MutationErrorFeedbackOptions
): MutationErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return {
      title: t('common.permission-denied.title', 'Permission denied'),
      description: t(
        'alertmanager.mutation.permission-denied.description',
        'You do not have permission to change {{resource}} for this data source.',
        { resource }
      ),
    };
  }

  if (isUnsupportedOperationError(error)) {
    return {
      title: t('alertmanager.mutation.not-supported.title', 'Configuration changes unavailable'),
      description: t(
        'alertmanager.mutation.not-supported.description',
        'This Alertmanager does not support updating {{resource}}.',
        { resource }
      ),
    };
  }

  return { title: fallbackTitle, description: extractErrorMessage(error) };
}
