import React from 'react';

import { t, Trans } from '@grafana/i18n';
import { Alert, ErrorBoundary, ErrorWithStack, Text } from '@grafana/ui';

import { getFlavor } from '../../../../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../../../../types/datasources';

import { DataSourceSection } from './DataSourceSection';

/**
 * Keeps a crash while showing one data source's rules from taking down the whole page.
 *
 * This is not where data source problems end up: a failed request or a response that doesn't match
 * the Prometheus API comes back as a query error, and is reported from there. What lands here is a
 * bug in how we show the rules, so it stays in place with its stack instead of being reported as a
 * fault of the data source.
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
