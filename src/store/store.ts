import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { config } from '@grafana/runtime';

import { STORAGE_KEYS } from '../constants';
import dataSourceReducer from './datasourceSlice';
import { alertmanagerApi } from '../api/alertmanager/alertmanager.endpoints';
import { featureDiscoveryApi } from '../api/rules/featureDiscovery.endpoints';
import { prometheusApi } from '../api/rules/prometheus.endpoints';
import { rulerApi } from '../api/rules/mimir.endpoints';

/**
 * Create the plugin store, optionally preselecting an Alertmanager data source.
 *
 * When `initialDataSourceUID` is omitted the `dataSource` slice is left to its own initial state
 * rather than being preloaded with a placeholder – the slice stays the single owner of what
 * "nothing selected" looks like.
 */
export const createStore = (initialDataSourceUID?: string) => {
  const store = configureStore({
    reducer: {
      dataSource: dataSourceReducer,
      [alertmanagerApi.reducerPath]: alertmanagerApi.reducer,
      [prometheusApi.reducerPath]: prometheusApi.reducer,
      [featureDiscoveryApi.reducerPath]: featureDiscoveryApi.reducer,
      [rulerApi.reducerPath]: rulerApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        alertmanagerApi.middleware,
        prometheusApi.middleware,
        featureDiscoveryApi.middleware,
        rulerApi.middleware
      ),
    preloadedState: initialDataSourceUID ? { dataSource: { selectedUID: initialDataSourceUID } } : undefined,
  });

  setupListeners(store.dispatch);

  return store;
};

/**
 * Get initial data source UID from sessionStorage or default to first available.
 *
 * Returns `undefined` when no Alertmanager data sources are configured – this must never throw
 * because it runs at module evaluation time and would take the entire plugin down with it. The UI
 * detects the missing data source and renders a dedicated page instead.
 */
function getInitialDataSourceUID(): string | undefined {
  const availableAlertmanagers = Object.values(config.datasources).filter((ds) => ds.type === 'alertmanager');

  // Try to get the stored UID from sessionStorage
  const storedUID = sessionStorage.getItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID);

  // If a UID is stored and it exists in the available alertmanagers, use it
  if (storedUID && availableAlertmanagers.some((am) => am.uid === storedUID)) {
    return storedUID;
  }

  // Otherwise, use the first available alertmanager or fallback to default
  const firstAlertmanager = availableAlertmanagers.at(0);
  if (firstAlertmanager) {
    // Store it in sessionStorage for next time
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, firstAlertmanager.uid);
    return firstAlertmanager.uid;
  }

  // No Alertmanagers configured – the UI will show a "no Alertmanager configured" page.
  return undefined;
}

/**
 * Shared Redux store instance used by both App and AppConfig components.
 * This ensures a single source of truth for the entire plugin.
 */
export const sharedStore = createStore(getInitialDataSourceUID());

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
