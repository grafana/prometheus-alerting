import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { t } from '@grafana/i18n';
import { Button, Input, Stack, useStyles2 } from '@grafana/ui';

interface EvaluationIntervalInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Common evaluation intervals for quick selection
const QUICK_INTERVALS = ['10s', '30s', '1m', '5m', '10m', '15m'];

/**
 * Parse a duration string to seconds
 */
function parseDurationToSeconds(duration: string): number {
  if (!duration) {
    return 0;
  }

  let totalSeconds = 0;
  const regex = /(\d+)(h|m|s)/g;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        totalSeconds += value * 3600;
        break;
      case 'm':
        totalSeconds += value * 60;
        break;
      case 's':
        totalSeconds += value;
        break;
    }
  }

  return totalSeconds;
}

/**
 * Validate that the interval is valid for all rules in the group
 * The interval should be <= the smallest "for" duration in the group
 */
export function validateInterval(interval: string, rules?: RulerRuleDTO[]): string | undefined {
  const intervalSeconds = parseDurationToSeconds(interval);

  if (intervalSeconds <= 0) {
    return t('alerting.evaluation-interval.invalid-format', 'Invalid duration format. Use formats like 1m, 30s, 1h.');
  }

  // Check if any alerting rules have a "for" duration smaller than the interval
  if (rules) {
    for (const rule of rules) {
      // Only alerting rules have a "for" property
      if ('alert' in rule && rule.for) {
        const forSeconds = parseDurationToSeconds(rule.for);
        if (forSeconds > 0 && intervalSeconds > forSeconds) {
          return t(
            'alerting.evaluation-interval.exceeds-pending',
            'Interval ({{interval}}) exceeds the pending period ({{for}}) of some rules. This may cause alerts to fire immediately.',
            { interval, for: rule.for }
          );
        }
      }
    }
  }

  return undefined;
}

export function EvaluationIntervalInput({ value, onChange }: EvaluationIntervalInputProps) {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={1}>
      <Input
        id="interval"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
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
            onClick={() => onChange(interval)}
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
