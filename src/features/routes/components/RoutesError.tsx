import React from 'react';

import { t } from '@grafana/i18n';

import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { isForbiddenError } from '../../../utils/errors';

interface RoutesErrorProps {
  error: unknown;
}

/** Displays clean permission feedback for forbidden route reads and datasource feedback for other failures. */
export function RoutesError({ error }: RoutesErrorProps) {
  if (isForbiddenError(error)) {
    return <PermissionDenied />;
  }

  return <DataSourceError error={error} title={t('routes.error-loading-title', 'Error loading routes')} />;
}
