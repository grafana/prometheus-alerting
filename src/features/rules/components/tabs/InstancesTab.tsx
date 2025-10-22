import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  useStyles2,
  EmptyState,
  InteractiveTable,
  Badge,
  Stack,
  Box,
  Text,
  type Column,
  type CellProps,
} from '@grafana/ui';
import { Trans, t } from '@grafana/i18n';
import { PromAlert, PromAlertingRuleDTO } from '@grafana/external-rules/vanilla';

interface Props {
  promRule: PromAlertingRuleDTO;
}

export function InstancesTab({ promRule }: Props) {
  const columns = useMemo<Array<Column<PromAlert>>>(
    () => [
      {
        id: 'state',
        header: t('rule-details.instances.columns.state', 'State'),
        cell: ({ row }: CellProps<PromAlert>) => {
          const state = row.original.state;
          const color = state === 'firing' ? 'red' : state === 'pending' ? 'orange' : 'blue';
          return <Badge text={state} color={color} />;
        },
      },
      {
        id: 'labels',
        header: t('rule-details.instances.columns.labels', 'Labels'),
        cell: ({ row }: CellProps<PromAlert>) => {
          const labels = row.original.labels;
          return (
            <Stack direction="row" gap={0.5} wrap={true}>
              {Object.entries(labels).map(([key, value]) => (
                <Badge
                  key={key}
                  text={t('rule-details.instances.label-badge', '{{key}}={{value}}', { key, value })}
                  color="blue"
                />
              ))}
            </Stack>
          );
        },
      },
      {
        id: 'activeAt',
        header: t('rule-details.instances.columns.active-at', 'Active Since'),
        cell: ({ row }: CellProps<PromAlert>) => (
          <Text variant="bodySmall">{new Date(row.original.activeAt).toLocaleString()}</Text>
        ),
      },
    ],
    []
  );

  const alerts = promRule.alerts ?? [];

  if (alerts.length === 0) {
    return <EmptyState variant="completed" message={t('rule-details.instances.empty', 'No active alert instances')} />;
  }

  return (
    <Box padding={2}>
      <Box marginBottom={2}>
        <Text variant="h6">
          {t('rule-details.instances.count', '{{count}} active instance(s)', { count: alerts.length })}
        </Text>
      </Box>
      <InteractiveTable
        columns={columns}
        data={alerts}
        getRowId={(alert, index) => `alert-${index}`}
        renderExpandedRow={(alert) => <AlertInstanceDetails alert={alert} />}
        showExpandAll={true}
      />
    </Box>
  );
}

interface AlertInstanceDetailsProps {
  alert: PromAlert;
}

function AlertInstanceDetails({ alert }: AlertInstanceDetailsProps) {
  const styles = useStyles2(getDetailsStyles);
  const hasAnnotations = Object.keys(alert.annotations).length > 0;
  const hasValue = alert.value !== undefined && alert.value !== null;

  // If there's nothing to show in the expanded view, return null
  if (!hasAnnotations && !hasValue) {
    return null;
  }

  return (
    <Stack direction="column" gap={2}>
      {/* Value */}
      {hasValue && (
        <Box>
          <Text variant="bodySmall">
            <Trans i18nKey="rule-details.instances.details.value">
              <strong>Value:</strong> {alert.value}
            </Trans>
          </Text>
        </Box>
      )}

      {/* Annotations */}
      {hasAnnotations && (
        <Box>
          <Text variant="h6">
            <Trans i18nKey="rule-details.instances.details.annotations">Annotations</Trans>
          </Text>
          <Box marginTop={1}>
            <pre className={styles.annotationsPre}>{JSON.stringify(alert.annotations, null, 2)}</pre>
          </Box>
        </Box>
      )}
    </Stack>
  );
}

const getDetailsStyles = (theme: GrafanaTheme2) => ({
  annotationsPre: css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.canvas,
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    overflow: 'auto',
  }),
});
