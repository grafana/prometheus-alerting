import {
  findExistingRoute,
  findRouteInTree,
  type Route,
  type RouteWithID,
} from '@grafana/external-alertmanager/vanilla';
import { produce } from 'immer';
import { omit } from 'lodash';
import { ERROR_NEWER_CONFIGURATION } from './constants';
import { arrayUtils } from '@grafana/data';

export type InsertPosition = 'above' | 'below' | 'child';

/**
 * Adds a new route to the route tree at a specified position relative to a reference route.
 * The position can be 'above', 'below', or 'child' of the reference route.
 *
 * @param newRoute - The new route to add
 * @param routeTree - The root of the route tree
 * @param position - Where to insert the route relative to the reference ('above', 'below', or 'child')
 * @param positionReference - The ID of the reference route
 * @returns A new route tree with the route added
 * @throws Error if the reference route is not found in the tree
 */
export const addRouteToReferenceRoute = (
  newRoute: Route,
  routeTree: RouteWithID,
  position: InsertPosition,
  positionReference: string
): RouteWithID => {
  return produce(routeTree, (draftTree) => {
    const [routeInTree, parentRoute, positionInParent] = findRouteInTree(draftTree, positionReference);

    if (routeInTree === undefined || parentRoute === undefined || positionInParent === undefined) {
      throw new Error(`could not find reference route "${positionReference}" in tree`, {
        cause: ERROR_NEWER_CONFIGURATION,
      });
    }

    // if user wants to insert new child route, append to the bottom of children
    if (position === 'child') {
      if (routeInTree.routes) {
        routeInTree.routes.push(newRoute);
      } else {
        routeInTree.routes = [newRoute];
      }
    }

    // insert new route before / above the referenceRoute
    if (position === 'above') {
      parentRoute.routes = arrayUtils.insertBeforeImmutably(parentRoute.routes ?? [], newRoute, positionInParent);
    }

    // insert new route after / below the referenceRoute
    if (position === 'below') {
      parentRoute.routes = arrayUtils.insertAfterImmutably(parentRoute.routes ?? [], newRoute, positionInParent);
    }
  });
};

/**
 * Recursively removes the 'id' property from a route and all its child routes.
 * Used before sending routes to Alertmanager API which doesn't accept custom IDs.
 *
 * @param route - The route with IDs to clean
 * @returns A route without ID properties
 */
export function cleanRouteIDs(route: RouteWithID): Route {
  return omit(
    {
      ...route,
      routes: route.routes?.map((route) => cleanRouteIDs(route)),
    },
    'id'
  );
}

/**
 * Merges partial route updates into the existing route tree.
 * Finds the route by ID and updates it with the provided partial data.
 *
 * @param partialNewRoute - Partial route data including the ID of the route to update
 * @param routeTree - The root of the route tree
 * @returns A new route tree with the route updated
 * @throws Error if the route with the specified ID is not found
 */
export const mergePartialRouteWithRouteTree = (
  partialNewRoute: Partial<RouteWithID>,
  routeTree: RouteWithID
): RouteWithID => {
  const existing = findExistingRoute(partialNewRoute.id ?? '', routeTree);
  if (!existing) {
    throw new Error(`No such route with ID '${partialNewRoute.id}'`, {
      // this allows any error handling (when using stringifyErrorLike) to identify and translate this exception
      // we do, however, make the assumption that this exception is the result of the route tree having been updating by the user
      // and this not being a programmer error.
      cause: ERROR_NEWER_CONFIGURATION,
    });
  }

  function findAndReplace(currentRoute: RouteWithID): RouteWithID {
    let updatedRoute: RouteWithID = currentRoute;

    if (currentRoute.id === partialNewRoute.id) {
      updatedRoute = {
        ...currentRoute,
        ...partialNewRoute,
      };
    }

    return {
      ...updatedRoute,
      routes: currentRoute.routes?.map(findAndReplace),
    };
  }

  return findAndReplace(routeTree);
};

/**
 * Removes a route from the route tree by its ID.
 * The root route cannot be removed.
 *
 * @param id - The ID of the route to remove
 * @param routeTree - The root of the route tree
 * @returns A new route tree with the route removed
 * @throws Error if attempting to remove the root route
 */
export const omitRouteFromRouteTree = (id: string, routeTree: RouteWithID): RouteWithID => {
  if (id === routeTree.id) {
    throw new Error('You cant remove the root route');
  }

  function findAndOmit(currentRoute: RouteWithID): RouteWithID {
    return {
      ...currentRoute,
      routes: currentRoute.routes?.reduce((acc: RouteWithID[] = [], route) => {
        if (route.id === id) {
          return acc;
        }

        acc.push(findAndOmit(route));
        return acc;
      }, []),
    };
  }

  return findAndOmit(routeTree);
};

/**
 * Recursively renames a receiver in a route and all its child routes.
 *
 * @param route - The route to rename the receiver in
 * @param oldName - The current name of the receiver
 * @param newName - The new name for the receiver
 * @returns A new route with the receiver renamed
 */
export function renameReceiverInRoute(route: Route, oldName: string, newName: string) {
  const updated: Route = {
    ...route,
  };

  if (updated.receiver === oldName) {
    updated.receiver = newName;
  }

  if (updated.routes) {
    updated.routes = updated.routes.map((route) => renameReceiverInRoute(route, oldName, newName));
  }

  return updated;
}
