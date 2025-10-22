import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { extractIntegrationsFromReceiver } from '../utils/integrationIcons';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteReceiverAction } from '../../../reducers/alertmanager/receivers';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

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

      return { label, value: value as string | number | boolean | undefined | null };
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
      <KeyValueList items={displayEntries} />
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
}

export function ReceiverDrawer({ receiver, onClose }: ReceiverDrawerProps) {
  const [produceNewConfig, { error: deleteError, isLoading: isDeleting }] = useProduceNewAlertmanagerConfiguration();
  const hasConfigurationAPI = useHasConfigurationAPI();

  if (!receiver) {
    return null;
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit receiver:', receiver.name);
  };

  const handleRemove = async () => {
    await produceNewConfig(deleteReceiverAction(receiver.name));
    onClose();
  };

  const hasActions = hasConfigurationAPI;

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
            <Button variant="secondary" onClick={handleEdit}>
              {t('receivers.drawer.edit', 'Edit')}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
              {t('receivers.drawer.remove', 'Remove')}
            </Button>
          </Stack>
        ) : undefined
      }
    >
      <Stack direction="column" gap={2}>
        {deleteError && (
          <Alert title={t('receivers.error-deleting-title', 'Error deleting receiver')} severity="error">
            {deleteError instanceof Error
              ? deleteError.message
              : t('receivers.error-deleting-message', 'Failed to delete receiver')}
          </Alert>
        )}
        <ReceiverIntegrations receiver={receiver} />
      </Stack>
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
});
