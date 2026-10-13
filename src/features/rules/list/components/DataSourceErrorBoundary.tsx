import React from 'react';

import { t, Trans } from '@grafana/i18n';
import { Alert, ErrorBoundary, ErrorWithStack, Text } from '@grafana/ui';

import { getFlavor } from '../../../../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../../../../types/datasources';

import { DataSourceSection } from './DataSourceSection';

/**
 * Some more exotic Prometheus data sources might not be 100% compatible with Prometheus API
 * We don't want them to break the whole page, so we wrap them in an error boundary
 *
 * A crash caught here is not reported as the data source failing. Responses are checked against a schema
 * before we render them, so a bad response already shows up as a request error. What's left to crash
 * here is mostly our own code, and reporting that would hide a data source that works fine.
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
