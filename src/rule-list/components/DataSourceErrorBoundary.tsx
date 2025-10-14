import React from 'react';

import { Alert, ErrorBoundary, ErrorWithStack, Text } from '@grafana/ui';

import { DataSourceRulesSourceIdentifier } from '../../types/datasources';

import { DataSourceSection } from './DataSourceSection';

/**
 * Some more exotic Prometheus data sources might not be 100% compatible with Prometheus API
 * We don't want them to break the whole page, so we wrap them in an error boundary
 */

export function DataSourceErrorBoundary({
  children,
  rulesSourceIdentifier,
}: {
  children: React.ReactNode;
  rulesSourceIdentifier: DataSourceRulesSourceIdentifier;
}) {
  return (
    <ErrorBoundary>
      {({ error, errorInfo }) => {
        if (error || errorInfo) {
          const { uid, name } = rulesSourceIdentifier;
          return (
            <DataSourceSection uid={uid} name={name}>
              <Alert title="Unable to load rules from this data source">
                <Text>Check the data source configuration. Does the data source support Prometheus API?</Text>
                <ErrorWithStack
                  error={error}
                  errorInfo={errorInfo}
                  title="Unable to load rules from this data source"
                />
              </Alert>
            </DataSourceSection>
          );
        }
        return children;
      }}
    </ErrorBoundary>
  );
}
