import React from 'react';
import { Alert } from '@grafana/ui';
import { t } from '@grafana/i18n';

/** Explains that the selected Alertmanager cannot update time intervals. */
export function TimeIntervalMutationUnavailable() {
  return (
    <Alert
      severity="warning"
      title={t('alertmanager.mutation.not-supported.title', 'Configuration changes unavailable')}
    >
      {t(
        'alertmanager.mutation.not-supported.time-intervals-description',
        'This Alertmanager does not support updating time intervals.'
      )}
    </Alert>
  );
}
