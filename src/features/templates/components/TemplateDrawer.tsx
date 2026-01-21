import React, { useState, useCallback } from 'react';
import { t, Trans } from '@grafana/i18n';
import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { Stack, Text, CodeEditor, Button, ConfirmModal, Alert } from '@grafana/ui';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { Template } from '../hooks/useTemplates';
import { TemplateEditForm, TemplateFormValues } from './TemplateEditForm';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import {
  addNotificationTemplateAction,
  updateNotificationTemplateAction,
  deleteNotificationTemplateAction,
} from '../../../reducers/alertmanager/templates';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { extractErrorMessage } from '../../../utils/errors';

export enum DrawerMode {
  View = 'view',
  Edit = 'edit',
  Add = 'add',
}

interface TemplateDrawerProps {
  template: Template | null;
  existingTemplateNames: string[];
  onClose: () => void;
  onSaved?: () => void;
  initialMode?: DrawerMode;
}

export function TemplateDrawer({
  template,
  existingTemplateNames,
  onClose,
  onSaved,
  initialMode = DrawerMode.View,
}: TemplateDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>(initialMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [produceNewConfig, { error: configError, isLoading }] = useProduceNewAlertmanagerConfiguration();
  const hasConfigurationAPI = useHasConfigurationAPI();

  const isViewMode = mode === DrawerMode.View;
  const isEditMode = mode === DrawerMode.Edit;
  const isAddMode = mode === DrawerMode.Add;
  const canEdit = hasConfigurationAPI;

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
    async (values: TemplateFormValues) => {
      try {
        if (isAddMode) {
          await produceNewConfig(addNotificationTemplateAction({ template: values }));
          getAppEvents().publish({
            type: AppEvents.alertSuccess.name,
            payload: [t('templates.create.success', 'Template created successfully')],
          });
        } else if (isEditMode && template) {
          await produceNewConfig(updateNotificationTemplateAction({ name: template.name, template: values }));
          getAppEvents().publish({
            type: AppEvents.alertSuccess.name,
            payload: [t('templates.update.success', 'Template updated successfully')],
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
              ? t('templates.create.error', 'Failed to create template')
              : t('templates.update.error', 'Failed to update template'),
            errorMessage,
          ],
        });
      }
    },
    [isAddMode, isEditMode, template, produceNewConfig, onSaved, onClose]
  );

  const handleDelete = useCallback(async () => {
    if (!template) {
      return;
    }
    try {
      await produceNewConfig(deleteNotificationTemplateAction({ name: template.name }));
      getAppEvents().publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('templates.delete.success', 'Template deleted successfully')],
      });
      onSaved?.();
      onClose();
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      getAppEvents().publish({
        type: AppEvents.alertError.name,
        payload: [t('templates.delete.error', 'Failed to delete template'), errorMessage],
      });
    }
    setShowDeleteConfirm(false);
  }, [template, produceNewConfig, onSaved, onClose]);

  // Don't render if no template and not in add mode
  if (!template && !isAddMode) {
    return null;
  }

  const getTitle = () => {
    if (isAddMode) {
      return (
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="templates.drawer.new-template">New Template</Trans>
          </Text>
          <Text variant="h2">
            <Trans i18nKey="templates.drawer.create-title">Create template</Trans>
          </Text>
        </Stack>
      );
    }

    if (isEditMode && template) {
      return (
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="templates.drawer.editing">Editing Template</Trans>
          </Text>
          <Text variant="h2">{template.name}</Text>
        </Stack>
      );
    }

    return (
      <Stack direction="column" gap={0}>
        <Text variant="bodySmall" color="secondary">
          <Trans i18nKey="templates.drawer.title">Template</Trans>
        </Text>
        <Text variant="h2">{template?.name ?? ''}</Text>
      </Stack>
    );
  };

  const getFooter = () => {
    // No footer in edit/add mode - form has its own buttons
    if (isEditMode || isAddMode) {
      return undefined;
    }

    // Footer with edit/delete buttons in view mode
    if (canEdit && template) {
      return (
        <Stack gap={2} justifyContent="flex-end">
          <Button variant="secondary" icon="pen" onClick={handleEdit}>
            <Trans i18nKey="templates.drawer.edit">Edit</Trans>
          </Button>
          <Button
            variant="destructive"
            icon="trash-alt"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
          >
            <Trans i18nKey="templates.drawer.delete">Delete</Trans>
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
        size={isViewMode ? 'md' : 'lg'}
        footer={getFooter()}
      >
        <Stack direction="column" gap={2}>
          {Boolean(configError) && (
            <Alert title={t('templates.error-title', 'Error')} severity="error">
              {String(
                configError instanceof Error ? configError.message : t('templates.error-message', 'An error occurred')
              )}
            </Alert>
          )}

          {/* View mode */}
          {isViewMode && template && (
            <>
              <Text variant="h6">
                <Trans i18nKey="templates.drawer.content-title">Template Content</Trans>
              </Text>

              {template.content ? (
                <CodeEditor
                  value={template.content}
                  language="go-html-template"
                  height={400}
                  readOnly
                  showLineNumbers
                  showMiniMap={false}
                />
              ) : (
                <Text color="secondary">
                  <Trans i18nKey="templates.drawer.no-content">No content available for this template.</Trans>
                </Text>
              )}

              <Text variant="bodySmall" color="secondary">
                <Trans i18nKey="templates.drawer.syntax-hint">
                  Templates use Go template syntax. Refer to the Alertmanager documentation for available functions and
                  variables.
                </Trans>
              </Text>
            </>
          )}

          {/* Edit/Add mode */}
          {(isEditMode || isAddMode) && (
            <TemplateEditForm
              template={isEditMode ? template ?? undefined : undefined}
              existingTemplateNames={existingTemplateNames}
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
        title={t('templates.delete.confirm-title', 'Delete template')}
        body={
          <Trans i18nKey="templates.delete.confirm-body" values={{ name: template?.name }}>
            Are you sure you want to delete the template &quot;{'{{name}}'}&quot;? This action cannot be undone.
          </Trans>
        }
        confirmText={t('templates.delete.confirm-button', 'Delete')}
        onConfirm={handleDelete}
        onDismiss={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
