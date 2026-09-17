import { createAction, createReducer } from '@reduxjs/toolkit';

import {
  addRouteToReferenceRoute,
  cleanRouteIDs,
  mergePartialRouteWithRouteTree,
  omitRouteFromRouteTree,
  InsertPosition,
  initialAlertmanagerConfiguration,
} from '@grafana/external-alertmanager/mimir';
import { RouteWithID } from '@grafana/external-alertmanager/vanilla';

import { attachRouteIds } from '../../features/routes/utils';

export const updateRouteAction = createAction<{ update: Partial<RouteWithID> }>('routes/update');
export const deleteRouteAction = createAction<{ id: string }>('routes/delete');
export const addRouteAction = createAction<{
  partialRoute: Partial<RouteWithID>;
  referenceRouteIdentifier: string;
  insertPosition: InsertPosition;
}>('routes/add');

/**
 * This reducer will manage action related to routes and make sure all operations on the alertmanager
 * configuration happen immutably and only mutate what they need.
 */
export const routesReducer = createReducer(initialAlertmanagerConfiguration, (builder) => {
  builder
    // update an existing route
    .addCase(updateRouteAction, (draft, { payload }) => {
      const { update } = payload;
      const { alertmanager_config } = draft;

      if (!alertmanager_config.route) {
        return;
      }

      const rootRouteWithIdentifiers = attachRouteIds(alertmanager_config.route);
      const newRouteTree = mergePartialRouteWithRouteTree(update, rootRouteWithIdentifiers);
      alertmanager_config.route = cleanRouteIDs(newRouteTree);
    })
    // delete a route
    .addCase(deleteRouteAction, (draft, { payload }) => {
      const { id } = payload;
      const { alertmanager_config } = draft;

      // if we don't even have a root route, we bail
      if (!alertmanager_config.route) {
        return;
      }

      const rootRouteWithIdentifiers = attachRouteIds(alertmanager_config.route);
      const updatedRouteTree = omitRouteFromRouteTree(id, rootRouteWithIdentifiers);
      draft.alertmanager_config.route = cleanRouteIDs(updatedRouteTree);
    })
    // add a new route to given position
    .addCase(addRouteAction, (draft, { payload }) => {
      const { partialRoute, referenceRouteIdentifier, insertPosition } = payload;
      const { alertmanager_config } = draft;

      if (!alertmanager_config.route) {
        return;
      }

      const rootRouteWithIdentifiers = attachRouteIds(alertmanager_config.route);
      const updatedRouteTree = addRouteToReferenceRoute(
        partialRoute,
        rootRouteWithIdentifiers,
        insertPosition,
        referenceRouteIdentifier
      );

      draft.alertmanager_config.route = cleanRouteIDs(updatedRouteTree);
    });
});
