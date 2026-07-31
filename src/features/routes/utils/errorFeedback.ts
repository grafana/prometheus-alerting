import { t } from '@grafana/i18n';

import { Ability } from '../../../access-control/abilities';
import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RouteErrorFeedback {
  title: string;
  description: string;
}

type UnavailableRouteAbility = Extract<Ability, { granted: false }>;

/** Returns user-facing feedback when a route mutation is unavailable before a request is sent. */
export function getRouteAbilityErrorFeedback(ability: UnavailableRouteAbility): RouteErrorFeedback {
  if (ability.cause === 'INSUFFICIENT_PERMISSIONS') {
    return getRoutePermissionDeniedFeedback();
  }

  return {
    title: t('routes.mutation-not-supported.title', 'Route changes unavailable'),
    description: t('routes.mutation-not-supported.description', 'This Alertmanager does not support updating routes.'),
  };
}

/** Returns user-facing feedback for a failed datasource-backed route mutation. */
export function getRouteMutationErrorFeedback(error: unknown, fallbackTitle: string): RouteErrorFeedback {
  if (isForbiddenError(error)) {
    return getRoutePermissionDeniedFeedback();
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
