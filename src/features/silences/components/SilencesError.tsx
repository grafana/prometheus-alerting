import React from 'react';

import { t } from '@grafana/i18n';

import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { isForbiddenError } from '../../../utils/errors';

interface SilencesErrorProps {
  error: unknown;
}

/** Displays clean permission feedback for forbidden silence reads and datasource feedback for other failures. */
export function SilencesError({ error }: SilencesErrorProps) {
  if (isForbiddenError(error)) {
    return <PermissionDenied />;
  }

  return <DataSourceError error={error} title={t('silences.error-loading-title', 'Error loading silences')} />;
}
