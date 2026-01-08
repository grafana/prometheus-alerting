import React from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Text, Button, IconButton, Icon } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { extractIntegrationsFromReceiver, getIntegrationIcon } from '../utils/integrationIcons';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteReceiverAction } from '../../../reducers/alertmanager/receivers';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { filterAndTransformConfigEntries } from '../utils/receiversUtils';
import { JsonValue } from 'type-fest';

interface IntegrationItemProps {
  type: string;
  config: Record<string, JsonValue>;
}

function IntegrationItem({ type, config }: IntegrationItemProps) {
  // Extract http_config if it exists
  const httpConfig = (config.http_config as Record<string, JsonValue>) ?? {};

  // Filter and transform main config entries (excluding http_config which is handled separately)
  const displayEntries = filterAndTransformConfigEntries(config, {
    excludeKeys: ['http_config'],
  });

  // Filter and transform http_config entries with empty object exclusion
  const httpConfigEntries = filterAndTransformConfigEntries(httpConfig, {
    excludeEmptyObjects: true,
  });

  const hasMainConfig = displayEntries.length > 0;
  const hasHttpConfig = httpConfigEntries.length > 0;

  const iconName = getIntegrationIcon(type);
  const titleWithIcon = (
    <Stack direction="row" gap={1} alignItems="center">
      <Icon name={iconName} />
      <span>{type}</span>
    </Stack>
  );

  if (!hasMainConfig && !hasHttpConfig) {
    return (
      <Section title={titleWithIcon}>
        <Alert title={t('receivers.integration.no-config', 'No configuration')} severity="info">
          {t('receivers.integration.no-config-desc', 'This integration has no visible configuration.')}
        </Alert>
      </Section>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      {hasMainConfig && (
        <Section title={titleWithIcon}>
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
  showBackButton?: boolean;
}

export function ReceiverDrawer({ receiver, onClose, showBackButton = false }: ReceiverDrawerProps) {
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

  const hasActions = hasConfigurationAPI && !showBackButton;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="row" gap={1} alignItems="center">
          {showBackButton && (
            <IconButton
              name="arrow-left"
              size="lg"
              variant="secondary"
              onClick={onClose}
              tooltip={t('receivers.drawer.back', 'Back to route')}
              aria-label={t('receivers.drawer.back', 'Back to route')}
            />
          )}
          <Stack direction="column" gap={0}>
            <Text variant="bodySmall" color="secondary">
              {t('receivers.drawer.title', 'Receiver')}
            </Text>
            <Text variant="h2">{receiver.name}</Text>
          </Stack>
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
