import React from 'react';
import { Alert } from '@grafana/ui';

import { getMutationErrorFeedback } from '../mutationErrorFeedback';

interface MutationErrorProps {
  error: unknown;
  fallbackTitle: string;
  resource: string;
}

/** Displays consistent feedback for failed Alertmanager configuration mutations. */
export function MutationError({ error, fallbackTitle, resource }: MutationErrorProps) {
  if (!error) {
    return null;
  }

  const feedback = getMutationErrorFeedback(error, { fallbackTitle, resource });

  return (
    <Alert title={feedback.title} severity="error">
      {feedback.description}
    </Alert>
  );
}
