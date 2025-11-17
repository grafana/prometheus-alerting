import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import dataSourceReducer from './datasourceSlice';
import { alertmanagerApi } from '../api/alertmanager/alertmanager.endpoints';
import { featureDiscoveryApi } from '../api/prometheus/featureDiscovery.endpoints';
import { prometheusApi } from '../api/prometheus/prometheus.endpoints';
import { rulerApi } from '../api/prometheus/ruler.endpoints';

export const createStore = (initialDataSourceUID: string) => {
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
    preloadedState: {
      dataSource: {
        selectedUID: initialDataSourceUID,
      },
    },
  });

  setupListeners(store.dispatch);

  return store;
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
