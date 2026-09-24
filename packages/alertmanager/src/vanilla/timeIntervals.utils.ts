import { type RouteWithID } from './routes.utils';

/** How a route uses a time interval: to mute notifications, or to limit them to a window. */
export type TimeIntervalUsage = 'mute' | 'active';

/** A route that refers to a time interval. */
export interface TimeIntervalUse {
  /** The ID of the route, so callers can point at it (e.g. link to it). */
  routeId: string;
  /** The receiver the route delivers to. Child routes can inherit it, so this may be empty. */
  receiver?: string;
  /** The route's matchers, which tell apart routes that deliver to the same receiver. */
  matchers?: string[];
  /** Every way the route uses the interval. A route can mute and restrict on the same one. */
  usedAs: TimeIntervalUsage[];
}

/**
 * Walks a route and its children collecting every route that refers to a time interval.
 *
 * Deleting a time interval takes it out of every route that mentions it, which quietly changes
 * when those routes notify. Callers use this to see what would be affected and say so first.
 *
 * @param timeInterval - The name of the time interval to look for
 * @param route - The route to search, including its children, with IDs attached (see addUniqueIdentifierToRoute)
 * @returns One entry per route, in the order the tree is walked
 */
export function findTimeIntervalUses(timeInterval: string, route: RouteWithID): TimeIntervalUse[] {
  const uses: TimeIntervalUse[] = [];

  const usedAs: TimeIntervalUsage[] = [];
  if (route.mute_time_intervals?.includes(timeInterval)) {
    usedAs.push('mute');
  }
  if (route.active_time_intervals?.includes(timeInterval)) {
    usedAs.push('active');
  }
  if (usedAs.length > 0) {
    uses.push({ routeId: route.id, receiver: route.receiver, matchers: route.matchers, usedAs });
  }

  for (const childRoute of route.routes ?? []) {
    uses.push(...findTimeIntervalUses(timeInterval, childRoute));
  }

  return uses;
}
