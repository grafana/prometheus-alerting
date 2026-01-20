import React from 'react';
import { Alert, Text } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { useAlertmanagerSafe } from '../hooks/useAlertmanager';
import { stringifyFetchError, ErrorLike } from '../utils/errors';

interface DataSourceErrorProps {
  error: ErrorLike;
  title: string;
}

/**
 * Reusable error component for displaying errors from Alertmanager API calls.
 * Automatically includes the current Alertmanager data source name in the error message.
 */
export function DataSourceError({ error, title }: DataSourceErrorProps) {
  const alertmanager = useAlertmanagerSafe();

  const errorMessage = stringifyFetchError(error);
  const dataSourceName = alertmanager?.settings.name;

  return (
    <Alert title={title} severity="error">
      {errorMessage}
      {dataSourceName && (
        <>
          <br />
          <Text variant="bodySmall" color="secondary">
            {t('alertmanager.error.data-source', 'Data source: {{name}}', { name: dataSourceName })}
          </Text>
        </>
      )}
    </Alert>
  );
}
