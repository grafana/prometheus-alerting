import React from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Text, Button } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { extractIntegrationsFromReceiver } from '../utils/integrationIcons';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteReceiverAction } from '../../../reducers/alertmanager/receivers';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

interface IntegrationItemProps {
  type: string;
  config: Record<string, unknown>;
}

function IntegrationItem({ type, config }: IntegrationItemProps) {
  // Extract http_config if it exists
  const httpConfig = config.http_config as Record<string, unknown> | undefined;

  // Filter out empty/null values
  const displayEntries = Object.entries(config)
    .filter(([key, value]) => {
      // Skip internal, empty fields, and http_config (handled separately)
      if (key.startsWith('_') || value === undefined || value === null || key === 'http_config') {
        return false;
      }
      return true;
    })
    .map(([key, value]) => {
      return { label: key, value: value as string | number | boolean | undefined | null };
    });

  // Process http_config entries if present
  const httpConfigEntries = httpConfig
    ? Object.entries(httpConfig)
        .filter(([key, value]) => {
          if (key.startsWith('_') || value === undefined || value === null) {
            return false;
          }
          // Skip nested objects that are empty
          if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
            return false;
          }
          return true;
        })
        .map(([key, value]) => {
          // Pass nested objects directly - KeyValueList will handle the rendering
          return { label: key, value: value as string | number | boolean | Record<string, unknown> | undefined | null };
        })
    : [];

  const hasMainConfig = displayEntries.length > 0;
  const hasHttpConfig = httpConfigEntries.length > 0;

  if (!hasMainConfig && !hasHttpConfig) {
    return (
      <Section title={type}>
        <Alert title={t('receivers.integration.no-config', 'No configuration')} severity="info">
          {t('receivers.integration.no-config-desc', 'This integration has no visible configuration.')}
        </Alert>
      </Section>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      {hasMainConfig && (
        <Section title={type}>
          <KeyValueList items={displayEntries} />
        </Section>
      )}
      {hasHttpConfig && (
        <Section title={t('receivers.integration.http-config-title', 'HTTP Configuration')}>
          <KeyValueList items={httpConfigEntries} />
        </Section>
      )}
    </Stack>
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
            {t('receivers.drawer.title', 'Receiver')}
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
        {Boolean(deleteError) && (
          <Alert title={t('receivers.error-deleting-title', 'Error deleting receiver')} severity="error">
            {String(
              deleteError instanceof Error
                ? deleteError.message
                : t('receivers.error-deleting-message', 'Failed to delete receiver')
            )}
          </Alert>
        )}
        <ReceiverIntegrations receiver={receiver} />
      </Stack>
    </DrawerWithFooter>
  );
}
