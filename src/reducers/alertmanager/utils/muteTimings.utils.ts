import { produce } from 'immer';

import { type Route } from '@grafana/external-alertmanager/vanilla';

/**
 * Recursively removes a time interval from a route and all its child routes.
 * Removes the time interval from both mute_time_intervals and active_time_intervals arrays.
 *
 * @param muteTiming - The name of the time interval to remove
 * @param route - The route to remove the time interval from
 * @returns A new route with the time interval removed
 */
export function removeTimeIntervalFromRoute(muteTiming: string, route: Route): Route {
  return produce(route, (draft) => {
    if (draft.mute_time_intervals) {
      draft.mute_time_intervals = draft.mute_time_intervals.filter((muteName) => muteName !== muteTiming);
    }
    if (draft.active_time_intervals) {
      draft.active_time_intervals = draft.active_time_intervals.filter((muteName) => muteName !== muteTiming);
    }
    if (draft.routes) {
      draft.routes = draft.routes.map((subRoute) => removeTimeIntervalFromRoute(muteTiming, subRoute));
    }
  });
}

/**
 * Recursively renames a time interval in a route and all its child routes.
 * Updates the time interval name in both mute_time_intervals and active_time_intervals arrays.
 *
 * @param newName - The new name for the time interval
 * @param oldName - The current name of the time interval
 * @param route - The route to rename the time interval in
 * @returns A new route with the time interval renamed
 */
export function renameTimeInterval(newName: string, oldName: string, route: Route): Route {
  return produce(route, (draft) => {
    if (draft.mute_time_intervals) {
      draft.mute_time_intervals = draft.mute_time_intervals.map((name) => (name === oldName ? newName : name));
    }
    if (draft.active_time_intervals) {
      draft.active_time_intervals = draft.active_time_intervals.map((name) => (name === oldName ? newName : name));
    }
    if (draft.routes) {
      draft.routes = draft.routes.map((subRoute) => renameTimeInterval(newName, oldName, subRoute));
    }
  });
}

/** One place a route refers to a time interval. */
export interface TimeIntervalUse {
  /** The receiver the route delivers to. Child routes can inherit it, so this may be empty. */
  receiver?: string;
  /** Whether the route uses the interval to mute notifications, or to limit them to a window. */
  usedAs: 'mute' | 'active';
}

/**
 * Walks a route and its children collecting every reference to a time interval.
 *
 * Deleting a time interval takes it out of every route that mentions it, which quietly changes
 * when those routes notify. Callers use this to see what would be affected and say so first.
 * A route that uses the same interval to both mute and restrict is reported twice, once each.
 *
 * @param timeInterval - The name of the time interval to look for
 * @param route - The route to search, including its children
 * @returns One entry per reference, in the order the tree is walked
 */
export function findTimeIntervalUses(timeInterval: string, route: Route): TimeIntervalUse[] {
  const uses: TimeIntervalUse[] = [];

  if (route.mute_time_intervals?.includes(timeInterval)) {
    uses.push({ receiver: route.receiver, usedAs: 'mute' });
  }

  if (route.active_time_intervals?.includes(timeInterval)) {
    uses.push({ receiver: route.receiver, usedAs: 'active' });
  }

  for (const childRoute of route.routes ?? []) {
    uses.push(...findTimeIntervalUses(timeInterval, childRoute));
  }

  return uses;
}
