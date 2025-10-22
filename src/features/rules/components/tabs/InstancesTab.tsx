import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, EmptyState } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { PromRuleDTO, PromAlert } from '@grafana/external-rules/vanilla';

interface Props {
  promRule: PromRuleDTO;
}

export function InstancesTab({ promRule }: Props) {
  const styles = useStyles2(getStyles);

  if (promRule.type !== 'alerting') {
    return null;
  }

  const alerts = promRule.alerts ?? [];

  if (alerts.length === 0) {
    return <EmptyState variant="completed" message={t('rule-details.instances.empty', 'No active alert instances')} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.count}>
        {t('rule-details.instances.count', '{{count}} active instance(s)', { count: alerts.length })}
      </div>
      <div className={styles.instancesList}>
        {alerts.map((alert, index) => (
          <AlertInstance key={index} alert={alert} />
        ))}
      </div>
    </div>
  );
}

interface AlertInstanceProps {
  alert: PromAlert;
}

function AlertInstance({ alert }: AlertInstanceProps) {
  const styles = useStyles2(getInstanceStyles);

  return (
    <div className={styles.instance}>
      <div className={styles.header}>
        <span className={styles.state}>{alert.state}</span>
        <span className={styles.activeAt}>Active since: {new Date(alert.activeAt).toLocaleString()}</span>
      </div>
      <div className={styles.labels}>
        <strong>Labels:</strong> {JSON.stringify(alert.labels)}
      </div>
      {alert.value && (
        <div className={styles.value}>
          <strong>Value:</strong> {alert.value}
        </div>
      )}
      {Object.keys(alert.annotations).length > 0 && (
        <div className={styles.annotations}>
          <strong>Annotations:</strong>
          <pre>{JSON.stringify(alert.annotations, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: theme.spacing(2),
  }),
  count: css({
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(2),
  }),
  instancesList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
});

const getInstanceStyles = (theme: GrafanaTheme2) => ({
  instance: css({
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  }),
  state: css({
    padding: theme.spacing(0.5, 1),
    backgroundColor: theme.colors.error.main,
    color: theme.colors.error.contrastText,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  activeAt: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  labels: css({
    marginTop: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  value: css({
    marginTop: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  annotations: css({
    marginTop: theme.spacing(1),
    fontSize: theme.typography.bodySmall.fontSize,
    '& pre': {
      marginTop: theme.spacing(0.5),
      padding: theme.spacing(1),
      backgroundColor: theme.colors.background.canvas,
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
    },
  }),
});
