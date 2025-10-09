import React, { useMemo, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../store/store';
import { useDataSource } from '../../contexts/DataSourceContext';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { dataSourceUID } = useDataSource();

  const store = useMemo(() => {
    return createStore(dataSourceUID);
  }, [dataSourceUID]);

  return <Provider store={store}>{children}</Provider>;
}
