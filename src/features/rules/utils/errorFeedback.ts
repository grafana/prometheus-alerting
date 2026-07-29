import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RulesErrorFeedback {
  title: string;
  description: string;
  detail?: string;
}

/** Returns consistent user-facing feedback for datasource-backed rule requests. */
export function getRulesErrorFeedback(error: unknown, fallbackTitle: string): RulesErrorFeedback {
  if (!isForbiddenError(error)) {
    return { title: fallbackTitle, description: extractErrorMessage(error) };
  }

  return {
    title: t('alerting.rules-error.permission-denied', 'Permission denied'),
    description: t(
      'alerting.rules-error.permission-denied-description',
      'You do not have permission to access rules from this data source.'
    ),
    detail: getServerErrorDetail(error),
  };
}

function getServerErrorDetail(error: unknown): string | undefined {
  if (error instanceof Error || typeof error === 'string') {
    return extractErrorMessage(error);
  }

  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return undefined;
  }

  const { data } = error;
  if (typeof data === 'string') {
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message;
  }

  return 'error' in data && typeof data.error === 'string' ? data.error : undefined;
}
