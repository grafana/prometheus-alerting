import React from 'react';
import { Alert, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';

interface RuleDetailsSubtitleProps {
  health?: string;
  lastError?: string;
}

export function RuleDetailsSubtitle({ health, lastError }: RuleDetailsSubtitleProps) {
  const hasError = health === 'error' || health === 'err';
  const showError = hasError && lastError;

  if (!showError) {
    return null;
  }

  return (
    <Stack direction="column" gap={0}>
      <Alert
        title={t('rule-details.error.evaluation', 'Something went wrong when evaluating this alert rule')}
        severity="error"
        bottomSpacing={0}
        topSpacing={2}
      >
        <pre style={{ marginBottom: 0 }}>
          <code>{lastError}</code>
        </pre>
      </Alert>
    </Stack>
  );
}
