import React, { useState } from 'react';

import { t, Trans } from '@grafana/i18n';
import { Alert, ErrorBoundary, ErrorWithStack, Text } from '@grafana/ui';

import { getFlavor } from '../../../../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../../../../types/datasources';

import { useReportDataSourceError } from '../hooks/useDataSourceErrors';

import { DataSourceSection } from './DataSourceSection';

/**
 * Some more exotic Prometheus data sources might not be 100% compatible with Prometheus API
 * We don't want them to break the whole page, so we wrap them in an error boundary
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

  useReportDataSourceError(uid, caughtError);

  return (
    <ErrorBoundary onError={(error) => setCaughtError(error ?? UNKNOWN_ERROR)}>
      {({ error, errorInfo }) => {
        if (error || errorInfo) {
          return (
            <DataSourceSection uid={uid} name={name} application={getFlavor(uid)?.application}>
              <Alert title={t('rules.error-boundary.title', 'Unable to load rules from this data source')}>
                <Text>
                  <Trans i18nKey="rules.error-boundary.message">
                    Check the data source configuration. Does the data source support Prometheus API?
                  </Trans>
                </Text>
                <ErrorWithStack
                  error={error}
                  errorInfo={errorInfo}
                  title={t('rules.error-boundary.stack-title', 'Unable to load rules from this data source')}
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
