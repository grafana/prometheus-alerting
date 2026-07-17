import { useReducer } from 'react';

import { RouteWithID } from '@grafana/external-alertmanager/mimir';

import { InsertPosition } from '../types';

// The route drawer is either closed, or showing exactly one of view/edit/add - modeled
// as a single tagged union so opening one can never leave another one incorrectly open.
export type DrawerState =
  | { type: 'closed' }
  | { type: 'view'; route: RouteWithID }
  | { type: 'edit'; route: RouteWithID }
  | { type: 'add'; referenceRouteId: string; insertPosition: InsertPosition };

export type DrawerAction =
  | { type: 'view'; route: RouteWithID }
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
