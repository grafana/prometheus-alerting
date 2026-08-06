import React, { useState } from 'react';

import { ErrorBoundary } from '@grafana/ui';

import { DataSourceRulesSourceIdentifier } from '../../../../types/datasources';

import { useReportDataSourceError } from '../hooks/useDataSourceErrors';

/**
 * Some more exotic Prometheus data sources might not be 100% compatible with Prometheus API
 * We don't want them to break the whole page, so we wrap them in an error boundary.
 * Data sources that throw are hidden from the list and reported in the sidebar instead.
 */

// Stable reference, a new Error on every render would re-trigger the error reporting effect
const UNKNOWN_ERROR = new Error(
  'Unable to load rules from this data source. Does the data source support the Prometheus API?'
);

export function DataSourceErrorBoundary({
  children,
  rulesSourceIdentifier,
}: {
  children: React.ReactNode;
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
}) {
  const { uid, name } = rulesSourceIdentifier;
  const [caughtError, setCaughtError] = useState<Error | null>(null);

  useReportDataSourceError(uid, name, caughtError);

  return (
    <ErrorBoundary onError={(error) => setCaughtError(error ?? UNKNOWN_ERROR)}>
      {({ error, errorInfo }) => (error || errorInfo ? null : children)}
    </ErrorBoundary>
  );
}
