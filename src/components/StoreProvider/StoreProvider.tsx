import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { AppStore } from '../../store/store';

interface StoreProviderProps {
  store: AppStore;
  children: ReactNode;
}

export function StoreProvider({ store, children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
