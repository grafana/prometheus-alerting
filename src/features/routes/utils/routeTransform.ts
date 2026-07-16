import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { FormAmRoute, MatcherFieldValue, MatcherOperator, emptyRoute } from '../types';
import { isValidPrometheusDuration } from '../../../utils/time.utils';

/**
 * Parse a matcher string like "severity=critical" or "team=~platform.*"
 */
function parseMatcherString(matcher: string): MatcherFieldValue {
  const match = matcher.match(/^([^=!~]+)(=~|!~|=|!=)(.*)$/);
  if (match) {
    const [, name, op, value] = match;
    let operator: MatcherOperator;
    switch (op) {
      case '=~':
        operator = MatcherOperator.regex;
        break;
      case '!~':
        operator = MatcherOperator.notRegex;
        break;
      case '!=':
        operator = MatcherOperator.notEqual;
        break;
      default:
        operator = MatcherOperator.equal;
    }
    return { name, operator, value };
  }
  return { name: matcher, operator: MatcherOperator.equal, value: '' };
}

/**
 * Convert a Route to a FormAmRoute for editing
 */
export function amRouteToFormAmRoute(route: RouteWithID | Route | undefined): FormAmRoute {
  if (!route) {
    return emptyRoute;
  }

  const id = 'id' in route ? route.id : '';

  if (Object.keys(route).length === 0) {
    return { ...emptyRoute, id };
  }

  // Convert child routes
  const formRoutes: FormAmRoute[] = [];
  route.routes?.forEach((subRoute) => {
    const subFormRoute = amRouteToFormAmRoute(subRoute as RouteWithID);
    formRoutes.push(subFormRoute);
  });

  // Convert string matchers to form field format
  const matchers: MatcherFieldValue[] = route.matchers?.map(parseMatcherString) ?? [];

  return {
    id,
    object_matchers: matchers,
    continue: route.continue ?? false,
    receiver: route.receiver ?? '',
    overrideGrouping: Array.isArray(route.group_by) && route.group_by.length > 0,
    groupBy: route.group_by ?? undefined,
    overrideTimings: [route.group_wait, route.group_interval, route.repeat_interval].some(Boolean),
    groupWaitValue: route.group_wait ?? '',
    groupIntervalValue: route.group_interval ?? '',
    repeatIntervalValue: route.repeat_interval ?? '',
    routes: formRoutes,
    muteTimeIntervals: route.mute_time_intervals ?? [],
    activeTimeIntervals: route.active_time_intervals ?? [],
  };
}

/**
 * Convert a FormAmRoute back to a Route for saving
 */
export function formAmRouteToAmRoute(formAmRoute: Partial<FormAmRoute>): Route {
  const {
    overrideGrouping,
    groupBy,
    overrideTimings,
    groupWaitValue,
    groupIntervalValue,
    repeatIntervalValue,
    receiver,
  } = formAmRoute;

  // "undefined" means "inherit from the parent route"
  const INHERIT_FROM_PARENT = undefined;

  const group_by = overrideGrouping ? groupBy : INHERIT_FROM_PARENT;
  const group_wait = overrideTimings && groupWaitValue ? groupWaitValue : INHERIT_FROM_PARENT;
  const group_interval = overrideTimings && groupIntervalValue ? groupIntervalValue : INHERIT_FROM_PARENT;
  const repeat_interval = overrideTimings && repeatIntervalValue ? repeatIntervalValue : INHERIT_FROM_PARENT;

  // Convert child routes
  const routes = formAmRoute.routes?.map((subRoute) => formAmRouteToAmRoute(subRoute));

  // For external Alertmanager, use string matchers format
  const matchers = formAmRoute.object_matchers
    ?.filter((m) => m.name)
    .map(({ name, operator, value }) => `${name}${operator}${value}`);

  const amRoute: Route = {
    continue: formAmRoute.continue ?? false,
    group_by,
    matchers,
    group_wait,
    group_interval,
    repeat_interval,
    routes,
    mute_time_intervals: formAmRoute.muteTimeIntervals,
    active_time_intervals: formAmRoute.activeTimeIntervals,
    receiver: receiver || undefined,
  };

  return amRoute;
}

/**
 * Validate a Prometheus duration string (e.g., "5m", "1h30m")
 * Empty strings are valid (inherits from parent)
 *
 * Re-exported from time.utils for convenience
 */
export function isValidPromDuration(duration: string): boolean {
  if (!duration || duration.length === 0) {
    return true; // Empty is valid (inherits from parent)
  }
  return isValidPrometheusDuration(duration);
}
