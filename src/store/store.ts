import { configureStore } from '@reduxjs/toolkit';
import dataSourceReducer from './datasourceSlice';
import { alertmanagerApi } from '../api/alertmanager.endpoints';
import { prometheusApi } from '../api/prometheus.endpoints';

export const createStore = (initialDataSourceUID: string) => {
  return configureStore({
    reducer: {
      dataSource: dataSourceReducer,
      [alertmanagerApi.reducerPath]: alertmanagerApi.reducer,
      [prometheusApi.reducerPath]: prometheusApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(alertmanagerApi.middleware, prometheusApi.middleware),
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
