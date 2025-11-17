import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { DataSourceRulesSourceIdentifier } from '../../../types/datasources';

import { DataSourceSection } from './components/DataSourceSection';
import { DataSourceErrorBoundary } from './components/DataSourceErrorBoundary';
import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';

interface DataSourceLoaderProps {
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  groupFilter?: string;
  namespaceFilter?: string;
}

export function DataSourceLoader({ rulesSourceIdentifier, groupFilter, namespaceFilter }: DataSourceLoaderProps) {
  const { uid, name } = rulesSourceIdentifier;

  // Run feature discovery
  const { data: features, isLoading, error } = useDiscoverFeaturesQuery({ uid });

  if (isLoading) {
    return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
  }

  if (error) {
    return <DataSourceSection error={error} uid={uid} name={name} />;
  }

  if (!features) {
    return <DataSourceSection error="Unable to discover data source features" uid={uid} name={name} />;
  }

  return (
    <DataSourceErrorBoundary rulesSourceIdentifier={rulesSourceIdentifier}>
      <PaginatedDataSourceLoader
        rulesSourceIdentifier={rulesSourceIdentifier}
        application={features.application}
        rulerApiEnabled={features.rulerApiEnabled}
        groupFilter={groupFilter}
        namespaceFilter={namespaceFilter}
      />
    </DataSourceErrorBoundary>
  );
}

export function DataSourceLoaderSkeleton({ name, uid }: { name: string; uid: string }) {
  return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
}
