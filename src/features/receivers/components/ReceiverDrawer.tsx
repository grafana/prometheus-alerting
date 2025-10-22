import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { extractIntegrationsFromReceiver } from '../utils/integrationIcons';

interface KeyValuePairProps {
  label: string;
  value: string | number | boolean | undefined | null;
}

function KeyValuePair({ label, value }: KeyValuePairProps) {
  const styles = useStyles2(getStyles);

  const displayValue = () => {
    if (value === undefined || value === null || value === '') {
      return t('receivers.drawer.empty-value', '(not set)');
    }
    if (typeof value === 'boolean') {
      return value ? t('receivers.drawer.true', 'Yes') : t('receivers.drawer.false', 'No');
    }
    return String(value);
  };

  return (
    <div className={styles.keyValuePair}>
      <dt className={styles.label}>{label}</dt>
      <span className={styles.dots}></span>
      <dd className={styles.value}>{displayValue()}</dd>
    </div>
  );
}

interface IntegrationItemProps {
  type: string;
  config: Record<string, unknown>;
}

function IntegrationItem({ type, config }: IntegrationItemProps) {
  const styles = useStyles2(getStyles);

  // Filter out empty/null values and convert to display-friendly format
  const displayEntries = Object.entries(config)
    .filter(([key, value]) => {
      // Skip internal or empty fields
      if (key.startsWith('_') || value === undefined || value === null) {
        return false;
      }
      return true;
    })
    .map(([key, value]) => {
      // Convert snake_case to Title Case
      const label = key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return { key, label, value };
    });

  if (displayEntries.length === 0) {
    return (
      <div className={styles.integrationCard}>
        <h4 className={styles.integrationTitle}>{type}</h4>
        <Alert title={t('receivers.integration.no-config', 'No configuration')} severity="info">
          {t('receivers.integration.no-config-desc', 'This integration has no visible configuration.')}
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.integrationCard}>
      <h4 className={styles.integrationTitle}>{type}</h4>
      <dl className={styles.keyValueList}>
        {displayEntries.map(({ key, label, value }) => (
          <KeyValuePair key={key} label={label} value={value as string | number | boolean | undefined | null} />
        ))}
      </dl>
    </div>
  );
}

interface ReceiverIntegrationsProps {
  receiver: Receiver;
}

function ReceiverIntegrations({ receiver }: ReceiverIntegrationsProps) {
  // Use centralized function to extract all integrations
  const integrations = extractIntegrationsFromReceiver(receiver);

  if (integrations.length === 0) {
    return (
      <Alert title={t('receivers.no-integrations', 'No integrations')} severity="info">
        {t('receivers.no-integrations-desc', 'This receiver has no integrations configured.')}
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      {integrations.map((integration, index) => (
        <IntegrationItem key={`${integration.type}-${index}`} type={integration.type} config={integration.config} />
      ))}
    </Stack>
  );
}

interface ReceiverDrawerProps {
  receiver: Receiver | null;
  onClose: () => void;
  onEdit?: (receiver: Receiver) => void;
  onRemove?: (receiver: Receiver) => void;
}

export function ReceiverDrawer({ receiver, onClose, onEdit, onRemove }: ReceiverDrawerProps) {
  if (!receiver) {
    return null;
  }

  const handleEdit = () => {
    onEdit?.(receiver);
  };

  const handleRemove = () => {
    onRemove?.(receiver);
  };

  const hasActions = onEdit || onRemove;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {t('receivers.detail.name', 'Receiver')}
          </Text>
          <Text variant="h2">{receiver.name}</Text>
        </Stack>
      }
      onClose={onClose}
      width={400}
      footer={
        hasActions ? (
          <Stack gap={2} justifyContent="flex-end">
            {onEdit && (
              <Button variant="secondary" onClick={handleEdit}>
                {t('receivers.drawer.edit', 'Edit')}
              </Button>
            )}
            {onRemove && (
              <Button variant="destructive" onClick={handleRemove}>
                {t('receivers.drawer.remove', 'Remove')}
              </Button>
            )}
          </Stack>
        ) : undefined
      }
    >
      <ReceiverIntegrations receiver={receiver} />
    </DrawerWithFooter>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  integrationCard: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
  }),
  integrationTitle: css({
    margin: 0,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    textTransform: 'capitalize',
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  keyValueList: css({
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  keyValuePair: css({
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minHeight: theme.spacing(3),
  }),
  label: css({
    margin: 0,
    flexShrink: 0,
    textAlign: 'left',
  }),
  dots: css({
    flex: 1,
    borderBottom: `2px dotted ${theme.colors.border.weak}`,
    minWidth: theme.spacing(2),
    height: '1px',
    marginBottom: theme.spacing(0.5),
  }),
  value: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
    whiteSpace: 'preserve',
    margin: 0,
    wordBreak: 'break-all',
    textAlign: 'right',
  }),
});
