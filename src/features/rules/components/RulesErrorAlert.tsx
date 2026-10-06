import React from 'react';

import { Alert } from '@grafana/ui';

import { getRulesErrorFeedback } from '../utils/errorFeedback';

interface RulesErrorAlertProps {
  error: unknown;
  title: string;
}

/** Consistent error feedback for datasource-backed rule requests. */
export function RulesErrorAlert({ error, title }: RulesErrorAlertProps) {
  const feedback = getRulesErrorFeedback(error);

  return (
    <Alert severity="error" title={title}>
      <span>{feedback.description}</span>
    </Alert>
  );
}
