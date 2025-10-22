import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, dateTimeFormat } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { t } from '@grafana/i18n';
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
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>{t('rule-details.details.evaluation-behavior', 'Evaluation Behavior')}</h3>

      <div className={styles.detailsGrid}>
        {interval && (
          <DetailField label={t('rule-details.field.interval', 'Evaluation Interval')}>
            {t('rule-details.field.interval-value', 'Every {{interval}}', { interval })}
          </DetailField>
        )}

        {forDuration && <DetailField label={t('rule-details.field.for', 'Pending Period')}>{forDuration}</DetailField>}

        {promRule.lastEvaluation && (
          <DetailField label={t('rule-details.field.last-evaluation', 'Last Evaluation')}>
            {dateTimeFormat(promRule.lastEvaluation)}
          </DetailField>
        )}

        {promRule.evaluationTime !== undefined && (
          <DetailField label={t('rule-details.field.evaluation-time', 'Evaluation Time')}>
            {promRule.evaluationTime.toFixed(3)}s
          </DetailField>
        )}

        {promRule.health && (
          <DetailField label={t('rule-details.field.health', 'Health')}>{promRule.health}</DetailField>
        )}

        {promRule.lastError && (
          <DetailField label={t('rule-details.field.last-error', 'Last Error')}>
            <pre className={styles.error}>{promRule.lastError}</pre>
          </DetailField>
        )}
      </div>

      {Object.keys(labels).length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>{t('rule-details.details.labels', 'Labels')}</h3>
          <div className={styles.keyValueList}>
            {Object.entries(labels).map(([key, value]) => (
              <div key={key} className={styles.keyValue}>
                <span className={styles.key}>{key}:</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {Object.keys(annotations).length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>{t('rule-details.details.annotations', 'Annotations')}</h3>
          <div className={styles.keyValueList}>
            {Object.entries(annotations).map(([key, value]) => (
              <div key={key} className={styles.keyValue}>
                <span className={styles.key}>{key}:</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.dataSource}>
        {hasRulerApi ? (
          <span className={styles.dataSourceBadge}>
            {t('rule-details.details.ruler-available', '✓ Ruler API Available')}
          </span>
        ) : (
          <span className={styles.dataSourceBadgeWarning}>
            {t('rule-details.details.ruler-unavailable', '⚠ Ruler API Unavailable (Read-only)')}
          </span>
        )}
      </div>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  children: React.ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
  const styles = useStyles2(getFieldStyles);

  return (
    <div className={styles.field}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{children}</div>
    </div>
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
  container: css({
    padding: theme.spacing(2),
  }),
  sectionTitle: css({
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
    '&:first-child': {
      marginTop: 0,
    },
  }),
  detailsGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: theme.spacing(2),
  }),
  keyValueList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  keyValue: css({
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  key: css({
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    minWidth: '150px',
  }),
  value: css({
    color: theme.colors.text.secondary,
    wordBreak: 'break-word',
  }),
  error: css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.error.transparent,
    border: `1px solid ${theme.colors.error.border}`,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    whiteSpace: 'pre-wrap',
    margin: 0,
  }),
  dataSource: css({
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
  dataSourceBadge: css({
    display: 'inline-block',
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.success.transparent,
    color: theme.colors.success.text,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  dataSourceBadgeWarning: css({
    display: 'inline-block',
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.warning.transparent,
    color: theme.colors.warning.text,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});

const getFieldStyles = (theme: GrafanaTheme2) => ({
  field: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  label: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
  }),
  value: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
  }),
});
