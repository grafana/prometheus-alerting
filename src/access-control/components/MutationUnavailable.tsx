import React from 'react';
import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

import { extractErrorMessage } from '../../utils/errors';

interface MutationUnavailableProps {
  resource: string;
  /** Why the check failed, when we could not find out whether the Alertmanager supports this. */
  error?: unknown;
}

/** Explains that the selected Alertmanager cannot update a configuration resource. */
export function MutationUnavailable({ resource, error }: MutationUnavailableProps) {
  return (
    <Alert
      severity="warning"
      title={t('alertmanager.mutation.not-supported.title', 'Configuration changes unavailable')}
    >
      {/* Without a successful check we cannot claim the Alertmanager lacks support, so say what
          went wrong instead of guessing at the reason. */}
      {error
        ? extractErrorMessage(error)
        : t(
            'alertmanager.mutation.not-supported.description',
            'This Alertmanager does not support updating {{resource}}.',
            { resource }
          )}
    </Alert>
  );
}
