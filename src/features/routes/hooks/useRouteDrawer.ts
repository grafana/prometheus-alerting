import { useReducer } from 'react';

import { RouteWithID } from '@grafana/external-alertmanager/vanilla';

import { InsertPosition } from '../types';

// The edit/add drawer is either closed, or showing exactly one of edit/add - modeled as a
// single tagged union so opening one can never leave the other incorrectly open.
// The view drawer isn't in here: which route it shows is kept in the URL (?routeId=) so the
// link can be shared, see RoutesList.
export type DrawerState =
  | { type: 'closed' }
  | { type: 'edit'; route: RouteWithID }
  | { type: 'add'; referenceRouteId: string; insertPosition: InsertPosition };

export type DrawerAction =
  | { type: 'edit'; route: RouteWithID }
  | { type: 'add'; referenceRouteId: string; insertPosition: InsertPosition }
  | { type: 'close' };

function drawerReducer(_state: DrawerState, action: DrawerAction): DrawerState {
  if (action.type === 'close') {
    return { type: 'closed' };
  }
  return action;
}

export function useRouteDrawer() {
  return useReducer(drawerReducer, { type: 'closed' });
}
