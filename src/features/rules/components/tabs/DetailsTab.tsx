import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, dateTimeFormat } from '@grafana/data';
import { useStyles2, Stack, Box, Text, Badge, Alert } from '@grafana/ui';
import { Trans, t } from '@grafana/i18n';
import { PromRuleDTO, PromRuleGroupDTO, RulerRuleDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

interface Props {
  promRule: PromRuleDTO;
  rulerRule?: RulerRuleDTO;
  promGroup?: PromRuleGroupDTO;
  rulerGroup?: RulerRuleGroupDTO | null;
  hasRulerApi: boolean;
}

export function DetailsTab({ promRule, rulerRule, promGroup, rulerGroup, hasRulerApi }: Props) {
  const styles = useStyles2(getStyles);

  // Get interval from ruler group or prom group
  const interval = rulerGroup?.interval ?? (promGroup ? `${promGroup.interval}s` : undefined);

  // Get for/duration - prefer ruler (string format), fallback to prom (number in seconds)
  const forDuration = (() => {
    // Try ruler first (it's a duration string like "5m")
    if (rulerRule && 'for' in rulerRule) {
      return rulerRule.for;
    }
    // Fallback to prom (it's a number in seconds)
    if (promRule.type === 'alerting' && promRule.duration !== undefined) {
      return formatDuration(promRule.duration);
    }
    return undefined;
  })();

  // Get labels and annotations with preference for ruler
  const labels = rulerRule?.labels ?? promRule.labels ?? {};

  // Annotations only exist on alerting rules
  const annotations: Record<string, string> = (() => {
    if (promRule.type === 'alerting') {
      // Prefer ruler annotations, fallback to prom annotations
      if (rulerRule && 'annotations' in rulerRule) {
        return rulerRule.annotations ?? {};
      }
      return promRule.annotations ?? {};
    }
    return {};
  })();

  return (
    <Box padding={2}>
      <Stack direction="column" gap={3}>
        {/* Evaluation Behavior Section */}
        <Box>
          <Box marginBottom={2}>
            <Text variant="h5">
              <Trans i18nKey="rule-details.details.evaluation-behavior">Evaluation Behavior</Trans>
            </Text>
          </Box>

          <div className={styles.detailsGrid}>
            {interval && (
              <DetailField label={t('rule-details.field.interval', 'Evaluation Interval')}>
                {t('rule-details.field.interval-value', 'Every {{interval}}', { interval })}
              </DetailField>
            )}

            {forDuration && (
              <DetailField label={t('rule-details.field.for', 'Pending Period')}>{forDuration}</DetailField>
            )}

            {promRule.lastEvaluation && (
              <DetailField label={t('rule-details.field.last-evaluation', 'Last Evaluation')}>
                {dateTimeFormat(promRule.lastEvaluation)}
              </DetailField>
            )}

            {promRule.evaluationTime !== undefined && (
              <DetailField label={t('rule-details.field.evaluation-time', 'Evaluation Time')}>
                {t('rule-details.field.evaluation-time-value', '{{time}}s', {
                  time: promRule.evaluationTime.toFixed(3),
                })}
              </DetailField>
            )}

            {promRule.health && (
              <DetailField label={t('rule-details.field.health', 'Health')}>{promRule.health}</DetailField>
            )}
          </div>

          {promRule.lastError && (
            <Box marginTop={2}>
              <Alert title={t('rule-details.field.last-error', 'Last Error')} severity="error">
                <pre className={styles.errorPre}>{promRule.lastError}</pre>
              </Alert>
            </Box>
          )}
        </Box>

        {/* Labels Section */}
        {Object.keys(labels).length > 0 && (
          <Box>
            <Box marginBottom={2}>
              <Text variant="h5">
                <Trans i18nKey="rule-details.details.labels">Labels</Trans>
              </Text>
            </Box>
            <Stack direction="column" gap={1}>
              {Object.entries(labels).map(([key, value]) => (
                <Box key={key} padding={1} backgroundColor="secondary" borderRadius="default" display="flex" gap={1}>
                  <Text variant="bodySmall" weight="medium">
                    {key}:
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    {value}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Annotations Section */}
        {Object.keys(annotations).length > 0 && (
          <Box>
            <Box marginBottom={2}>
              <Text variant="h5">
                <Trans i18nKey="rule-details.details.annotations">Annotations</Trans>
              </Text>
            </Box>
            <Stack direction="column" gap={1}>
              {Object.entries(annotations).map(([key, value]) => (
                <Box key={key} padding={1} backgroundColor="secondary" borderRadius="default" display="flex" gap={1}>
                  <Text variant="bodySmall" weight="medium">
                    {key}:
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    {value}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Data Source Status */}
        <Box marginTop={1} paddingTop={2} borderStyle="solid" borderColor="weak">
          {hasRulerApi ? (
            <Badge text={t('rule-details.details.ruler-available', '✓ Ruler API Available')} color="green" />
          ) : (
            <Badge
              text={t('rule-details.details.ruler-unavailable', '⚠ Ruler API Unavailable (Read-only)')}
              color="orange"
            />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

interface DetailFieldProps {
  label: string;
  children: React.ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Stack direction="column" gap={0.5}>
      <Text variant="bodySmall" weight="medium" color="secondary">
        {label}
      </Text>
      <Text variant="body">{children ?? ''}</Text>
    </Stack>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m${remainingSeconds}s`;
}

const getStyles = (theme: GrafanaTheme2) => ({
  detailsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: theme.spacing(2),
  }),
  errorPre: css({
    fontSize: theme.typography.bodySmall.fontSize,
    whiteSpace: 'pre-wrap',
    margin: 0,
  }),
});
