import { type Route } from '@grafana/external-alertmanager/vanilla';
import { produce } from 'immer';

// Changing a time interval means changing the routes that refer to it too. Only Mimir lets us
// write the Alertmanager configuration, so these live here rather than with the vanilla helpers.

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
