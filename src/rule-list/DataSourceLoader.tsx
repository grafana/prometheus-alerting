import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { DataSourceRulesSourceIdentifier } from '../types/datasources';

import { DataSourceSection } from './components/DataSourceSection';
import { DataSourceErrorBoundary } from './components/DataSourceErrorBoundary';
import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';

interface DataSourceLoaderProps {
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  groupFilter?: string;
  namespaceFilter?: string;
}

export function DataSourceLoader({ rulesSourceIdentifier, groupFilter, namespaceFilter }: DataSourceLoaderProps) {
  // For now, we're assuming all data sources are Prometheus-compatible
  // In the future, we can add feature discovery here
  const application = 'prometheus';

  return (
    <DataSourceErrorBoundary rulesSourceIdentifier={rulesSourceIdentifier}>
      <PaginatedDataSourceLoader
        rulesSourceIdentifier={rulesSourceIdentifier}
        application={application}
        groupFilter={groupFilter}
        namespaceFilter={namespaceFilter}
      />
    </DataSourceErrorBoundary>
  );
}

export function DataSourceLoaderSkeleton({ name, uid }: { name: string; uid: string }) {
  return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
}
