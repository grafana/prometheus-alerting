import React from 'react';

import { t } from '@grafana/i18n';
import { Alert } from '@grafana/ui';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

interface RulesErrorAlertProps {
  error: unknown;
  title: string;
}

/** Consistent error feedback for datasource-backed rule requests. */
export function RulesErrorAlert({ error, title }: RulesErrorAlertProps) {
  const isAccessDenied = isForbiddenError(error);

  return (
    <Alert
      severity="error"
      title={isAccessDenied ? t('alerting.rules-error.permission-denied', 'Permission denied') : title}
    >
      {isAccessDenied
        ? t(
            'alerting.rules-error.permission-denied-description',
            'You do not have permission to access rules from this data source.'
          )
        : extractErrorMessage(error)}
    </Alert>
  );
}
