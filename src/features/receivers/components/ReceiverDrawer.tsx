import React, { useState, useCallback } from 'react';
import { t, Trans } from '@grafana/i18n';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { Alert, Stack, Text, Button, IconButton, Icon, ConfirmModal } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { extractIntegrationsFromReceiver, getIntegrationIcon } from '../utils/integrationIcons';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { addReceiverAction, deleteReceiverAction, updateReceiverAction } from '../../../reducers/alertmanager/receivers';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { filterAndTransformConfigEntries } from '../utils/receiversUtils';
import { JsonValue } from 'type-fest';
import { ReceiverEditForm } from './ReceiverEditForm';
import { extractErrorMessage } from '../../../utils/errors';
import { useReceiverInUse } from '../hooks/useReceiverInUse';

export enum DrawerMode {
  View = 'view',
  Edit = 'edit',
  Add = 'add',
}

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
  existingReceivers?: Receiver[];
  onClose: () => void;
  onSaved?: () => void;
  showBackButton?: boolean;
  initialMode?: DrawerMode;
}

export function ReceiverDrawer({
  receiver,
  existingReceivers = [],
  onClose,
  onSaved,
  showBackButton = false,
  initialMode = DrawerMode.View,
}: ReceiverDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>(initialMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [produceNewConfig, { error: configError, isLoading }] = useProduceNewAlertmanagerConfiguration();
  const hasConfigurationAPI = useHasConfigurationAPI();
  const { isInUse, isDefaultReceiver, usageCount } = useReceiverInUse(receiver?.name);

  const isViewMode = mode === DrawerMode.View;
  const isEditMode = mode === DrawerMode.Edit;
  const isAddMode = mode === DrawerMode.Add;
  const canEdit = hasConfigurationAPI && !showBackButton;
  // Cannot delete the default receiver or a receiver that's in use
  const canDelete = canEdit && !isDefaultReceiver;

  const handleEdit = useCallback(() => {
    setMode(DrawerMode.Edit);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (isAddMode) {
      onClose();
    } else {
      setMode(DrawerMode.View);
    }
  }, [isAddMode, onClose]);

  const handleSave = useCallback(
    async (newReceiver: Receiver) => {
      try {
        if (isAddMode) {
          await produceNewConfig(addReceiverAction(newReceiver));
          getAppEvents().publish({
            type: AppEvents.alertSuccess.name,
            payload: [t('receivers.create.success', 'Receiver created successfully')],
          });
        } else if (isEditMode && receiver) {
          await produceNewConfig(updateReceiverAction({ name: receiver.name, receiver: newReceiver }));
          getAppEvents().publish({
            type: AppEvents.alertSuccess.name,
            payload: [t('receivers.update.success', 'Receiver updated successfully')],
          });
        }
        onSaved?.();
        onClose();
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [
            isAddMode
              ? t('receivers.create.error', 'Failed to create receiver')
              : t('receivers.update.error', 'Failed to update receiver'),
            errorMessage,
          ],
        });
      }
    },
    [isAddMode, isEditMode, receiver, produceNewConfig, onSaved, onClose]
  );

  const handleDelete = useCallback(async () => {
    if (!receiver) {
      return;
    }
    try {
      await produceNewConfig(deleteReceiverAction(receiver.name));
      getAppEvents().publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('receivers.delete.success', 'Receiver deleted successfully')],
      });
      onSaved?.();
      onClose();
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      getAppEvents().publish({
        type: AppEvents.alertError.name,
        payload: [t('receivers.delete.error', 'Failed to delete receiver'), errorMessage],
      });
    }
    setShowDeleteConfirm(false);
  }, [receiver, produceNewConfig, onSaved, onClose]);

  // Don't render if no receiver and not in add mode
  if (!receiver && !isAddMode) {
    return null;
  }

  const getTitle = () => {
    if (isAddMode) {
      return (
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="receivers.drawer.new-receiver">New Receiver</Trans>
          </Text>
          <Text variant="h2">
            <Trans i18nKey="receivers.drawer.create-title">Create receiver</Trans>
          </Text>
        </Stack>
      );
    }

    if (isEditMode && receiver) {
      return (
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="receivers.drawer.editing">Editing Receiver</Trans>
          </Text>
          <Text variant="h2">{receiver.name}</Text>
        </Stack>
      );
    }

    return (
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
            <Trans i18nKey="receivers.drawer.title">Receiver</Trans>
          </Text>
          <Text variant="h2">{receiver?.name ?? ''}</Text>
        </Stack>
      </Stack>
    );
  };

  const getFooter = () => {
    // No footer in edit/add mode - form has its own buttons
    if (isEditMode || isAddMode) {
      return undefined;
    }

    // Footer with edit/delete buttons in view mode
    if (canEdit && receiver) {
      return (
        <Stack gap={2} justifyContent="flex-end">
          <Button variant="secondary" icon="pen" onClick={handleEdit}>
            <Trans i18nKey="receivers.drawer.edit">Edit</Trans>
          </Button>
          <Button
            variant="destructive"
            icon="trash-alt"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || !canDelete}
            {...(isDefaultReceiver && {
              tooltip: t('receivers.drawer.cannot-delete-default', 'Cannot delete the default receiver'),
            })}
          >
            <Trans i18nKey="receivers.drawer.remove">Delete</Trans>
          </Button>
        </Stack>
      );
    }

    return undefined;
  };

  return (
    <>
      <DrawerWithFooter
        title={getTitle()}
        onClose={isEditMode || isAddMode ? handleCancelEdit : onClose}
        size={isViewMode ? 'sm' : 'md'}
        footer={getFooter()}
      >
        <Stack direction="column" gap={2}>
          {Boolean(configError) && (
            <Alert title={t('receivers.error-title', 'Error')} severity="error">
              {String(
                configError instanceof Error
                  ? configError.message
                  : t('receivers.error-message', 'An error occurred')
              )}
            </Alert>
          )}

          {/* View mode */}
          {isViewMode && receiver && <ReceiverIntegrations receiver={receiver} />}

          {/* Edit/Add mode */}
          {(isEditMode || isAddMode) && (
            <ReceiverEditForm
              receiver={isEditMode ? receiver ?? undefined : undefined}
              existingReceivers={existingReceivers}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          )}
        </Stack>
      </DrawerWithFooter>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('receivers.delete.confirm-title', 'Delete receiver')}
        body={
          <Stack direction="column" gap={2}>
            {isInUse && (
              <Alert
                title={t('receivers.delete.in-use-warning-title', 'Receiver is in use')}
                severity="warning"
              >
                <Trans
                  i18nKey="receivers.delete.in-use-warning"
                  values={{ count: usageCount }}
                >
                  This receiver is currently used by {'{{count}}'} route(s). Deleting it may cause alerts to not be delivered.
                </Trans>
              </Alert>
            )}
            <Text>
              <Trans i18nKey="receivers.delete.confirm-body" values={{ name: receiver?.name }}>
                Are you sure you want to delete the receiver &quot;{'{{name}}'}&quot;? This action cannot be undone.
              </Trans>
            </Text>
          </Stack>
        }
        confirmText={t('receivers.delete.confirm-button', 'Delete')}
        onConfirm={handleDelete}
        onDismiss={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
