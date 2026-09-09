import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Button, Input, Stack, useStyles2 } from '@grafana/ui';

import { safeParsePrometheusDuration } from '../../../utils/time.utils';

interface EvaluationIntervalInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

// Common evaluation intervals for quick selection
const QUICK_INTERVALS = ['10s', '30s', '1m', '5m', '10m', '15m'];

export function validateInterval(interval: string): string | undefined {
  const intervalMs = safeParsePrometheusDuration(interval);

  if (intervalMs <= 0) {
    return t('alerting.evaluation-interval.invalid-format', 'Invalid duration format. Use formats like 1m, 30s, 1h.');
  }

  return undefined;
}

export function EvaluationIntervalInput({ value, onChange, onBlur }: EvaluationIntervalInputProps) {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={1}>
      <Input
        id="interval"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onBlur={onBlur}
        placeholder={t('alerting.evaluation-interval.placeholder', 'e.g. 1m, 30s, 5m')}
        className={styles.input}
      />
      <Stack direction="row" gap={0.5} wrap="wrap">
        {QUICK_INTERVALS.map((interval) => (
          <Button
            key={interval}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              onChange(interval);
              onBlur?.();
            }}
            className={value === interval ? styles.selectedButton : undefined}
          >
            {interval}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  input: css({
    maxWidth: '200px',
  }),
  selectedButton: css({
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.colors.primary.shade,
    },
  }),
});
