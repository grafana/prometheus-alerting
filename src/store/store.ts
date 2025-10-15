import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import dataSourceReducer, { setDataSourceUID } from './datasourceSlice';
import { alertmanagerApi as vanillaAlertmanagerAPI } from '../api/alertmanager.endpoints';
import { alertmanagerApi as mimirAlertmanagerAPI } from '../api/mimir.endpoints';
import { prometheusApi } from '../api/prometheus.endpoints';

export const createStore = (initialDataSourceUID: string) => {
  // Create listener middleware to handle data source changes
  const listenerMiddleware = createListenerMiddleware();

  // Listen for data source UID changes and reset the API cache
  listenerMiddleware.startListening({
    actionCreator: setDataSourceUID,
    effect: async (_action, listenerApi) => {
      // Reset all API state when data source changes
      // This forces all queries to refetch with the new data source
      listenerApi.dispatch(vanillaAlertmanagerAPI.util.resetApiState());
      listenerApi.dispatch(mimirAlertmanagerAPI.util.resetApiState());
      listenerApi.dispatch(prometheusApi.util.resetApiState());
    },
  });

  return configureStore({
    reducer: {
      dataSource: dataSourceReducer,
      [vanillaAlertmanagerAPI.reducerPath]: vanillaAlertmanagerAPI.reducer,
      [mimirAlertmanagerAPI.reducerPath]: mimirAlertmanagerAPI.reducer,
      [prometheusApi.reducerPath]: prometheusApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        vanillaAlertmanagerAPI.middleware,
        mimirAlertmanagerAPI.middleware,
        prometheusApi.middleware,
        listenerMiddleware.middleware
      ),
    preloadedState: {
      dataSource: {
        selectedUID: initialDataSourceUID,
      },
    },
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
