import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import dataSourceReducer, { setDataSourceUID } from './datasourceSlice';
import { alertmanagerApi } from '../api/alertmanager.endpoints';

export const createStore = (initialDataSourceUID: string) => {
  // Create listener middleware to handle data source changes
  const listenerMiddleware = createListenerMiddleware();

  // Listen for data source UID changes and reset the API cache
  listenerMiddleware.startListening({
    actionCreator: setDataSourceUID,
    effect: async (action, listenerApi) => {
      // Reset all API state when data source changes
      // This forces all queries to refetch with the new data source
      listenerApi.dispatch(alertmanagerApi.util.resetApiState());
    },
  });

  return configureStore({
    reducer: {
      dataSource: dataSourceReducer,
      [alertmanagerApi.reducerPath]: alertmanagerApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(alertmanagerApi.middleware, listenerMiddleware.middleware),
    preloadedState: {
      dataSource: {
        selectedUID: initialDataSourceUID,
      },
    },
  });
};

// Export the API instance so hooks can use it
export { alertmanagerApi };

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
