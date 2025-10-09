import { configureStore } from '@reduxjs/toolkit';
import { createAlertmanagerApi } from '@grafana/external-alertmanager/vanilla';

export const createStore = (dataSourceUID: string) => {
  const api = createAlertmanagerApi(dataSourceUID);

  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
