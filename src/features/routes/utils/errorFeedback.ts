import { t } from '@grafana/i18n';

import { isPermissionDeniedError, isUnsupportedOperationError } from '../../../access-control/errors';
import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RouteErrorFeedback {
  title: string;
  description: string;
}

/** Returns user-facing feedback for a failed datasource-backed route mutation. */
export function getRouteMutationErrorFeedback(error: unknown, fallbackTitle: string): RouteErrorFeedback {
  if (isPermissionDeniedError(error) || isForbiddenError(error)) {
    return getRoutePermissionDeniedFeedback();
  }

  if (isUnsupportedOperationError(error)) {
    return {
      title: t('routes.mutation-not-supported.title', 'Route changes unavailable'),
      description: t(
        'routes.mutation-not-supported.description',
        'This Alertmanager does not support updating routes.'
      ),
    };
  }

  return {
    title: fallbackTitle,
    description: extractErrorMessage(error),
  };
}

function getRoutePermissionDeniedFeedback(): RouteErrorFeedback {
  return {
    title: t('routes.permission-denied.title', 'Permission denied'),
    description: t(
      'routes.permission-denied.description',
      'You do not have permission to change routes for this data source.'
    ),
  };
}
