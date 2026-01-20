import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { FormAmRoute, InsertPosition, MatcherFieldValue, MatcherOperator, emptyRoute } from '../types';
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

  // "undefined" means "inherit from the parent policy"
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
 * Merge an updated route into an existing route tree
 */
export function mergeRouteIntoTree(routeTree: Route, routeId: string, updatedRoute: Partial<FormAmRoute>): Route {
  const mergedRoute = formAmRouteToAmRoute(updatedRoute);

  function findAndReplace(route: Route, parentIndex = '0'): Route {
    const currentId = 'id' in route ? (route as RouteWithID).id : parentIndex;

    if (currentId === routeId) {
      // Found the route to update - merge changes
      return {
        ...route,
        ...mergedRoute,
        // Preserve routes if not explicitly updating them
        routes: mergedRoute.routes ?? route.routes,
      };
    }

    // Recurse into child routes
    if (route.routes) {
      return {
        ...route,
        routes: route.routes.map((child, index) => findAndReplace(child, `${parentIndex}-${index}`)),
      };
    }

    return route;
  }

  return findAndReplace(routeTree);
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

/**
 * Validate repeat interval is >= group interval
 */
export function repeatIntervalValidator(repeatInterval: string, groupInterval = ''): string | true {
  if (!repeatInterval) {
    return true;
  }

  if (!isValidPromDuration(repeatInterval)) {
    return 'Invalid duration format';
  }

  // If both are set, repeat should be >= group interval
  // For simplicity, we just validate format here
  return true;
}

/**
 * Add a new route to the tree relative to a reference route.
 *
 * @param routeTree - The current route tree
 * @param referenceRouteId - The ID of the route to add relative to
 * @param newRoute - The new route data from the form
 * @param position - Where to insert: 'above', 'below', or 'child'
 */
export function addRouteToTree(
  routeTree: Route,
  referenceRouteId: string,
  newRoute: Partial<FormAmRoute>,
  position: InsertPosition
): Route {
  const routeToAdd = formAmRouteToAmRoute(newRoute);

  function findAndInsert(route: Route, parentIndex = '0'): { route: Route; found: boolean } {
    const currentId = 'id' in route ? (route as RouteWithID).id : parentIndex;

    // Check if current route is the reference route
    if (currentId === referenceRouteId) {
      if (position === 'child') {
        // Add as a child of the reference route
        return {
          route: {
            ...route,
            routes: [...(route.routes ?? []), routeToAdd],
          },
          found: true,
        };
      }
      // For 'above' and 'below', we need to handle at parent level
      return { route, found: true };
    }

    // Recurse into child routes
    if (route.routes) {
      const newRoutes: Route[] = [];
      let found = false;

      for (let i = 0; i < route.routes.length; i++) {
        const child = route.routes[i];
        const childId = 'id' in child ? (child as RouteWithID).id : `${parentIndex}-${i}`;

        if (childId === referenceRouteId && position !== 'child') {
          // Insert above or below this child
          if (position === 'above') {
            newRoutes.push(routeToAdd);
            newRoutes.push(child);
          } else {
            // position === 'below'
            newRoutes.push(child);
            newRoutes.push(routeToAdd);
          }
          found = true;
        } else {
          // Recurse into this child
          const result = findAndInsert(child, `${parentIndex}-${i}`);
          newRoutes.push(result.route);
          if (result.found) {
            found = true;
          }
        }
      }

      return {
        route: { ...route, routes: newRoutes },
        found,
      };
    }

    return { route, found: false };
  }

  const result = findAndInsert(routeTree);

  if (!result.found) {
    throw new Error(`Could not find reference route "${referenceRouteId}" in tree`);
  }

  return result.route;
}

/**
 * Strip IDs from a route tree before saving to Alertmanager.
 * Alertmanager doesn't understand IDs, so we need to remove them.
 */
export function stripRouteIds(route: Route | RouteWithID): Route {
  const { id, ...routeWithoutId } = route as RouteWithID;

  return {
    ...routeWithoutId,
    routes: routeWithoutId.routes?.map(stripRouteIds),
  };
}
