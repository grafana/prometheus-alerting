import React from 'react';
import { Alert } from '@grafana/ui';

import { getReceiverMutationErrorFeedback } from '../receiverErrorFeedback';

interface ReceiverMutationErrorProps {
  error: unknown;
  fallbackTitle: string;
}

export function ReceiverMutationError({ error, fallbackTitle }: ReceiverMutationErrorProps) {
  if (!error) {
    return null;
  }

  const feedback = getReceiverMutationErrorFeedback(error, fallbackTitle);

  return (
    <Alert title={feedback.title} severity="error">
      {feedback.description}
    </Alert>
  );
}
