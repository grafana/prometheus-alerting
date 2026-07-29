import React from 'react';

import { Alert } from '@grafana/ui';

import { getRulesErrorFeedback } from '../utils/errorFeedback';

interface RulesErrorAlertProps {
  error: unknown;
  title: string;
}

/** Consistent error feedback for datasource-backed rule requests. */
export function RulesErrorAlert({ error, title }: RulesErrorAlertProps) {
  const feedback = getRulesErrorFeedback(error, title);

  return (
    <Alert severity="error" title={feedback.title}>
      <span>{feedback.description}</span>
      {feedback.detail && (
        <>
          <br />
          <span>{feedback.detail}</span>
        </>
      )}
    </Alert>
  );
}
