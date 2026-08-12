import React from 'react';
import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

interface MutationUnavailableProps {
  resource: string;
}

/** Explains that the selected Alertmanager cannot update a configuration resource. */
export function MutationUnavailable({ resource }: MutationUnavailableProps) {
  return (
    <Alert
      severity="warning"
      title={t('alertmanager.mutation.not-supported.title', 'Configuration changes unavailable')}
    >
      {t(
        'alertmanager.mutation.not-supported.description',
        'This Alertmanager does not support updating {{resource}}.',
        { resource }
      )}
    </Alert>
  );
}
