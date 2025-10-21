import type { Route } from '@grafana/external-alertmanager/vanilla';
import { produce } from 'immer';
import { omit } from 'lodash';
import hashObject from 'object-hash';
import { ERROR_NEWER_CONFIGURATION } from './constants';
import { arrayUtils } from '@grafana/data';

export type RouteWithID = Route & { id: string };
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

    // if user wants to insert new child policy, append to the bottom of children
    if (position === 'child') {
      if (routeInTree.routes) {
        routeInTree.routes.push(newRoute);
      } else {
        routeInTree.routes = [newRoute];
      }
    }

    // insert new policy before / above the referenceRoute
    if (position === 'above') {
      parentRoute.routes = arrayUtils.insertBeforeImmutably(parentRoute.routes ?? [], newRoute, positionInParent);
    }

    // insert new policy after / below the referenceRoute
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
      // we do, however, make the assumption that this exception is the result of the policy tree having been updating by the user
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
 * Removes a route from the policy tree by its ID.
 * The root route cannot be removed.
 *
 * @param id - The ID of the route to remove
 * @param routeTree - The root of the route tree
 * @returns A new route tree with the route removed
 * @throws Error if attempting to remove the root policy
 */
export const omitRouteFromRouteTree = (id: string, routeTree: RouteWithID): RouteWithID => {
  if (id === routeTree.id) {
    throw new Error('You cant remove the root policy');
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
 * Recursively adds stable unique identifiers to each route in the route tree.
 * IDs are generated based on position in the tree and content hash to ensure stability.
 *
 * @param route - The route to add IDs to
 * @param position - The position string used to generate unique IDs (default: '0')
 * @returns A route tree with unique IDs added to each route
 */
export function addUniqueIdentifierToRoute(route: Route, position = '0'): RouteWithID {
  const routeHash = hashRoute(route);
  const routes = route.routes ?? [];

  return {
    id: `${position}-${routeHash}`,
    ...route,
    routes: routes.map((route, index) => addUniqueIdentifierToRoute(route, `${position}-${index}`)),
  };
}

/**
 * Generates a stable hash for a route based on its content.
 * Used to create unique identifiers that remain consistent across re-renders.
 *
 * @param route - The route to hash
 * @returns A string hash of the route
 */
export function hashRoute(route: Route): string {
  return hashObject(route);
}

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

type RouteMatch = Route | undefined;

/**
 * Recursively searches for a route in the tree by its ID.
 * Returns the matching route, its parent route, and its position within the parent's children.
 *
 * @param routeTree - The root of the route tree to search
 * @param referenceRouteIdentifier - The ID of the route to find
 * @returns A tuple containing [matchingRoute, parentRoute, positionInParent]
 */
export function findRouteInTree(
  routeTree: RouteWithID,
  referenceRouteIdentifier: string
): [matchingRoute: RouteMatch, parentRoute: RouteMatch, positionInParent: number | undefined] {
  let matchingRoute: RouteMatch;
  let matchingRouteParent: RouteMatch;
  let matchingRoutePositionInParent: number | undefined;

  // recurse through the tree to find the matching route, its parent and the position of the route in the parent
  function findRouteInTree(currentRoute: RouteWithID, index: number, parentRoute: RouteWithID) {
    if (matchingRoute) {
      return;
    }

    if (currentRoute.id === referenceRouteIdentifier) {
      matchingRoute = currentRoute;
      matchingRouteParent = parentRoute;
      matchingRoutePositionInParent = index;
    }

    if (currentRoute.routes) {
      currentRoute.routes.forEach((route, index) => findRouteInTree(route, index, currentRoute));
    }
  }

  findRouteInTree(routeTree, 0, routeTree);

  return [matchingRoute, matchingRouteParent, matchingRoutePositionInParent];
}

/**
 * Recursively searches for a route in the tree by its ID.
 *
 * @param id - The ID of the route to find
 * @param routeTree - The root of the route tree to search
 * @returns The matching route or undefined if not found
 */
export function findExistingRoute(id: string, routeTree: RouteWithID): RouteWithID | undefined {
  return routeTree.id === id ? routeTree : routeTree.routes?.find((route) => findExistingRoute(id, route));
}
