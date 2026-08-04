import React from 'react';

import { t } from '@grafana/i18n';

import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { isForbiddenError } from '../../../utils/errors';

interface TemplatesErrorProps {
  error: unknown;
}

/** Displays clean permission feedback for forbidden template reads. */
export function TemplatesError({ error }: TemplatesErrorProps) {
  if (isForbiddenError(error)) {
    return <PermissionDenied />;
  }

  return <DataSourceError error={error} title={t('templates.error-loading-title', 'Error loading templates')} />;
}
