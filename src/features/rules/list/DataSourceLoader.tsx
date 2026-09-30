import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { DataSourceRulesSourceIdentifier } from '../../../types/datasources';

import { DataSourceSection } from './components/DataSourceSection';
import { DataSourceErrorBoundary } from './components/DataSourceErrorBoundary';
import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';
import { useReportDataSourceError, useReportDataSourceLoading } from './hooks/useDataSourceErrors';

interface DataSourceLoaderProps {
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  groupFilter?: string;
  namespaceFilter?: string;
  /** When true, hide the datasource section if it has no matching results */
  hideOnEmpty?: boolean;
}

export function DataSourceLoader({
  rulesSourceIdentifier,
  groupFilter,
  namespaceFilter,
  hideOnEmpty = false,
}: DataSourceLoaderProps) {
  const { uid, name } = rulesSourceIdentifier;

  // Run feature discovery
  const { data: features, isLoading, error } = useDiscoverFeaturesQuery({ uid });

  // Data sources we cannot talk to are hidden from the list and reported in the sidebar instead
  const discoveryError = error ?? (!isLoading && !features ? 'Unable to discover data source features' : undefined);
  useReportDataSourceError(uid, name, discoveryError);
  useReportDataSourceLoading(uid, isLoading);

  if (isLoading) {
    // While loading, show skeleton only if not hiding on empty
    // (we don't know yet if there will be results)
    if (hideOnEmpty) {
      return null;
    }
    return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
  }

  if (discoveryError || !features) {
    return null;
  }

  return (
    <DataSourceErrorBoundary rulesSourceIdentifier={rulesSourceIdentifier}>
      <PaginatedDataSourceLoader
        rulesSourceIdentifier={rulesSourceIdentifier}
        application={features.application}
        rulerApiEnabled={features.rulerApiEnabled}
        groupFilter={groupFilter}
        namespaceFilter={namespaceFilter}
        hideOnEmpty={hideOnEmpty}
      />
    </DataSourceErrorBoundary>
  );
}

export function DataSourceLoaderSkeleton({ name, uid }: { name: string; uid: string }) {
  return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
}
