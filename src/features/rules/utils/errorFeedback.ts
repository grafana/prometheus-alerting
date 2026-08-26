import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RulesErrorFeedback {
  title: string;
  description: string;
}

/** Returns consistent user-facing feedback for datasource-backed rule requests. */
export function getRulesErrorFeedback(error: unknown, fallbackTitle: string): RulesErrorFeedback {
  if (isForbiddenError(error)) {
    return {
      title: t('alerting.rules-error.permission-denied', 'Permission denied'),
      description: t(
        'alerting.rules-error.permission-denied-description',
        'You do not have permission to access rules from this data source.'
      ),
    };
  }

  const message = extractErrorMessage(error).trim();

  return {
    title: fallbackTitle,
    description: message.length > 0 ? message : t('alerting.rules-error.unknown', 'An unknown error occurred'),
  };
}
