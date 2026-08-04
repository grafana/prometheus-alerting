import { t } from '@grafana/i18n';

import { isPermissionDeniedError, isUnsupportedOperationError } from '../../../access-control/errors';
import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface TemplateErrorFeedback {
  title: string;
  description: string;
}

/** Returns user-facing feedback for a failed template mutation. */
export function getTemplateMutationErrorFeedback(error: unknown, fallbackTitle: string): TemplateErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return {
      title: t('templates.permission-denied.title', 'Permission denied'),
      description: t(
        'templates.permission-denied.description',
        'You do not have permission to change templates for this data source.'
      ),
    };
  }

  if (isUnsupportedOperationError(error)) {
    return {
      title: t('templates.mutation-not-supported.title', 'Template changes unavailable'),
      description: t(
        'templates.mutation-not-supported.description',
        'This Alertmanager does not support updating templates.'
      ),
    };
  }

  return { title: fallbackTitle, description: extractErrorMessage(error) };
}
