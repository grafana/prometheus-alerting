import React from 'react';

import { t } from '@grafana/i18n';

import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { isForbiddenError } from '../../../utils/errors';

interface ReceiversErrorProps {
  error: unknown;
  title?: string;
}

/** Displays clean permission feedback for forbidden receiver reads. */
export function ReceiversError({
  error,
  title = t('receivers.error-loading-title', 'Error loading receivers'),
}: ReceiversErrorProps) {
  if (isForbiddenError(error)) {
    return <PermissionDenied />;
  }

  return <DataSourceError error={error} title={title} />;
}
