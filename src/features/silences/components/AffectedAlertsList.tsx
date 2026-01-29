import React from 'react';
import { css } from '@emotion/css';
import { t, Trans } from '@grafana/i18n';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Stack, Text, useStyles2, Badge } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import Skeleton from 'react-loading-skeleton';
import type { GettableSilence, GettableAlert } from '@grafana/external-alertmanager/vanilla';
import { useAffectedAlerts } from '../hooks/useAffectedAlerts';

interface AlertItemProps {
  alert: GettableAlert;
}

function AlertItem({ alert }: AlertItemProps) {
  const styles = useStyles2(getStyles);

  // Get summary or description annotation
  const summary = alert.annotations?.summary || alert.annotations?.description || '';

  // Get alertname from labels
  const alertName = alert.labels.alertname || t('silences.affected-alerts.unknown-alert', 'Unknown Alert');

  return (
    <div className={styles.alertItem}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
          <Text variant="body" weight="medium">
            {alertName}
          </Text>
          <Badge text={alert.status.state} color={alert.status.state === 'active' ? 'orange' : 'blue'} />
        </Stack>

        {summary && (
          <Text variant="bodySmall" color="secondary" truncate>
            {summary}
          </Text>
        )}

        <Stack direction="row" gap={0.5} wrap>
          {Object.entries(alert.labels)
            .filter(([key]) => key !== 'alertname')
            .slice(0, 5) // Limit displayed labels
            .map(([key, value]) => (
              <AlertLabel key={key} value={`${key}=${value}`} colorBy="value" size="sm" />
            ))}
          {Object.keys(alert.labels).length > 6 && (
            <Text variant="bodySmall" color="secondary">
              +{Object.keys(alert.labels).length - 6} <Trans i18nKey="silences.affected-alerts.more-labels">more</Trans>
            </Text>
          )}
        </Stack>
      </Stack>
    </div>
  );
}

interface AffectedAlertsListProps {
  silence: GettableSilence;
}

export function AffectedAlertsList({ silence }: AffectedAlertsListProps) {
  const styles = useStyles2(getStyles);
  const { alerts, isLoading, error } = useAffectedAlerts(silence);

  if (isLoading) {
    return (
      <Stack direction="column" gap={1}>
        <Skeleton height={60} count={3} style={{ marginBottom: '8px' }} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert title={t('silences.affected-alerts.error-title', 'Error loading alerts')} severity="error">
        {error instanceof Error
          ? error.message
          : t('silences.affected-alerts.error-message', 'Failed to load affected alerts')}
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text color="secondary">
          <Trans i18nKey="silences.affected-alerts.no-alerts">
            No alerts are currently being silenced by this silence.
          </Trans>
        </Text>
        <Text variant="bodySmall" color="secondary">
          <Trans i18nKey="silences.affected-alerts.no-alerts-hint">
            This could mean the silence has expired, or no alerts match the defined matchers.
          </Trans>
        </Text>
      </div>
    );
  }

  return (
    <Stack direction="column" gap={1}>
      <Text variant="bodySmall" color="secondary">
        <Trans i18nKey="silences.affected-alerts.count" values={{ count: alerts.length }}>
          {'{{count}}'} alert(s) silenced
        </Trans>
      </Text>
      <div className={styles.alertsList}>
        {alerts.map((alert, index) => (
          <AlertItem key={`${alert.fingerprint}-${index}`} alert={alert} />
        ))}
      </div>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  alertsList: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  alertItem: css({
    padding: theme.spacing(1.5),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  emptyState: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
    gap: theme.spacing(1),
  }),
});
