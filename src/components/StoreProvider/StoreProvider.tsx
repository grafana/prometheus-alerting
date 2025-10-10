import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../store/store';

interface StoreProviderProps {
  initialDataSourceUID: string;
  children: ReactNode;
}

export function StoreProvider({ initialDataSourceUID, children }: StoreProviderProps) {
  const store = createStore(initialDataSourceUID);

  return <Provider store={store}>{children}</Provider>;
}
