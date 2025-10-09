import React, { createContext, useContext, ReactNode } from 'react';

interface DataSourceContextType {
  dataSourceUID: string;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

interface DataSourceProviderProps {
  dataSourceUID: string;
  children: ReactNode;
}

export function DataSourceProvider({ dataSourceUID, children }: DataSourceProviderProps) {
  return <DataSourceContext.Provider value={{ dataSourceUID }}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSourceContextType {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
}
