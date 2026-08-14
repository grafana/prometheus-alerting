import React from 'react';
import Skeleton from 'react-loading-skeleton';

import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { getFlavor } from '../../../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../../../types/datasources';

import { DataSourceSection } from './components/DataSourceSection';
import { DataSourceErrorBoundary } from './components/DataSourceErrorBoundary';
import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';

interface DataSourceLoaderProps {
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
  groupFilter?: string;
  namespaceFilter?: string;
  /** When true, hide the datasource section if it has errors or no matching results */
  hideOnEmptyOrError?: boolean;
}

export function DataSourceLoader({
  rulesSourceIdentifier,
  groupFilter,
  namespaceFilter,
  hideOnEmptyOrError = false,
}: DataSourceLoaderProps) {
  const { uid, name } = rulesSourceIdentifier;

  // Run feature discovery
  const { data: features, isLoading, error } = useDiscoverFeaturesQuery({ uid });

  // Discovery is what normally tells us which application this is, so when it fails we fall back to
  // whatever the plugin type already settles -- otherwise a failing data source loses its icon and
  // becomes hard to identify in a list of several.
  const knownApplication = getFlavor(uid)?.application;

  if (isLoading) {
    // While loading, show skeleton only if not hiding on empty/error
    // (we don't know yet if there will be results)
    if (hideOnEmptyOrError) {
      return null;
    }
    return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
  }

  if (error) {
    // Hide datasource with errors when filters are active
    if (hideOnEmptyOrError) {
      return null;
    }
    return <DataSourceSection error={error} uid={uid} name={name} application={knownApplication} />;
  }

  if (!features) {
    if (hideOnEmptyOrError) {
      return null;
    }
    return (
      <DataSourceSection
        error="Unable to discover data source features"
        uid={uid}
        name={name}
        application={knownApplication}
      />
    );
  }

  return (
    <DataSourceErrorBoundary rulesSourceIdentifier={rulesSourceIdentifier}>
      <PaginatedDataSourceLoader
        rulesSourceIdentifier={rulesSourceIdentifier}
        application={features.application}
        rulerApiEnabled={features.rulerApiEnabled}
        groupFilter={groupFilter}
        namespaceFilter={namespaceFilter}
        hideOnEmpty={hideOnEmptyOrError}
      />
    </DataSourceErrorBoundary>
  );
}

export function DataSourceLoaderSkeleton({ name, uid }: { name: string; uid: string }) {
  return <DataSourceSection loader={<Skeleton width={250} height={16} />} uid={uid} name={name} />;
}
