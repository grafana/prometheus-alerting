import { configureStore } from '@reduxjs/toolkit';
import dataSourceReducer from './datasourceSlice';
import { alertmanagerApi as vanillaAlertmanagerAPI } from '../api/alertmanager.endpoints';
import { alertmanagerApi as mimirAlertmanagerAPI } from '../api/mimir.endpoints';
import { prometheusApi } from '../api/prometheus.endpoints';

export const createStore = (initialDataSourceUID: string) => {
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
