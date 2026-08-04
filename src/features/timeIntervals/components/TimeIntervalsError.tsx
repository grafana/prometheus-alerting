import React from 'react';

import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

import { Ability } from '../../../access-control/abilities';
import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { isForbiddenError } from '../../../utils/errors';

interface TimeIntervalsErrorProps {
  error: unknown;
  title?: string;
}

/** Displays clean permission feedback for forbidden time interval reads. */
export function TimeIntervalsError({
  error,
  title = t('time-intervals.error-loading-title', 'Error loading time intervals'),
}: TimeIntervalsErrorProps) {
  if (isForbiddenError(error)) {
    return <PermissionDenied />;
  }

  return <DataSourceError error={error} title={title} />;
}

/** Displays why a time interval mutation workflow cannot be used. */
export function TimeIntervalMutationUnavailable({ ability }: { ability: Ability }) {
  if (ability.granted) {
    return null;
  }

  if (ability.cause === 'INSUFFICIENT_PERMISSIONS') {
    return <PermissionDenied />;
  }

  return (
    <Alert
      severity="warning"
      title={t('time-intervals.mutation-not-supported.title', 'Time interval changes unavailable')}
    >
      {t(
        'time-intervals.mutation-not-supported.description',
        'This Alertmanager does not support updating time intervals.'
      )}
    </Alert>
  );
}
