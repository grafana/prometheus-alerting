import React, { useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller, useWatch, FormProvider } from 'react-hook-form';
import { t, Trans } from '@grafana/i18n';
import { Button, Field, Input, Stack, Combobox, Switch, IconButton, Alert, Box, Text } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';

import {
  ReceiverFormValues,
  receiverToFormValues,
  formValuesToReceiver,
  createDefaultReceiverFormValues,
  createDefaultIntegration,
  isReceiverNameUnique,
} from '../utils/receiverFormTransform';
import { createReceiverFormSchema } from '../utils/receiverFormSchema';
import { extractErrorMessage } from '../../../utils/errors';
import { MutationError } from '../../../access-control/components/MutationError';
import {
  CloudIntegrationType,
  getCloudIntegrationTypeOptions,
  isCloudIntegrationType,
} from '../utils/cloudIntegrationTypes';
import { DiscordIntegrationForm } from '../integrations/discord/DiscordIntegrationForm';
import { EmailIntegrationForm } from '../integrations/email/EmailIntegrationForm';
import { JiraIntegrationForm } from '../integrations/jira/JiraIntegrationForm';
import { MSTeamsIntegrationForm } from '../integrations/msteams/MSTeamsIntegrationForm';
import { OpsgenieIntegrationForm } from '../integrations/opsgenie/OpsgenieIntegrationForm';
import { PagerDutyIntegrationForm } from '../integrations/pagerduty/PagerDutyIntegrationForm';
import { PushoverIntegrationForm } from '../integrations/pushover/PushoverIntegrationForm';
import { SlackIntegrationForm } from '../integrations/slack/SlackIntegrationForm';
import { SNSIntegrationForm } from '../integrations/sns/SNSIntegrationForm';
import { TelegramIntegrationForm } from '../integrations/telegram/TelegramIntegrationForm';
import { VictorOpsIntegrationForm } from '../integrations/victorops/VictorOpsIntegrationForm';
import { WeChatIntegrationForm } from '../integrations/wechat/WeChatIntegrationForm';
import { WebhookIntegrationForm } from '../integrations/webhook/WebhookIntegrationForm';
import { WebexIntegrationForm } from '../integrations/webex/WebexIntegrationForm';

interface ReceiverEditFormProps {
  receiver?: Receiver;
  existingReceivers: Receiver[];
  onSave: (receiver: Receiver) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  /** Set when the last save attempt failed, so we can show it next to the save button. */
  saveError?: unknown;
  saveErrorTitle?: string;
}

export function ReceiverEditForm({
  receiver,
  existingReceivers,
  onSave,
  onCancel,
  isLoading = false,
  saveError,
  saveErrorTitle,
}: ReceiverEditFormProps) {
  const isEditMode = Boolean(receiver);
  const originalName = receiver?.name;

  // A stored configuration can hold something the form schema does not expect, and the mappers
  // throw when it does. Catch it here: falling back to defaults would show an empty form that
  // silently overwrites the real receiver on save, so we show what went wrong instead.
  const initialValues = useMemo(() => {
    if (!receiver) {
      return { values: createDefaultReceiverFormValues(), error: null };
    }
    try {
      return { values: receiverToFormValues(receiver), error: null };
    } catch (error) {
      return { values: createDefaultReceiverFormValues(), error };
    }
  }, [receiver]);

  const receiverFormSchema = useMemo(() => createReceiverFormSchema(), []);
  const formAPI = useForm<ReceiverFormValues>({
    defaultValues: initialValues.values,
    resolver: zodResolver(receiverFormSchema),
    mode: 'onBlur',
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formAPI;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'integrations',
  });

  const onSubmit = useCallback(
    async (values: ReceiverFormValues) => {
      const newReceiver = formValuesToReceiver(values);
      await onSave(newReceiver);
    },
    [onSave]
  );

  const handleAddIntegration = useCallback(() => {
    append(createDefaultIntegration('webhook'));
  }, [append]);

  const notifierTypeOptions = useMemo(() => getCloudIntegrationTypeOptions(), []);

  if (initialValues.error) {
    return (
      <Stack direction="column" gap={2}>
        <Alert title={t('receivers.form.unsupported-title', 'This receiver cannot be edited here')} severity="error">
          <Stack direction="column" gap={1}>
            <Trans i18nKey="receivers.form.unsupported-body">
              Its configuration has a shape this form does not understand, so editing it here could drop settings. Edit
              it in the Alertmanager configuration instead.
            </Trans>
            <Text variant="bodySmall">{extractErrorMessage(initialValues.error)}</Text>
          </Stack>
        </Alert>
        <Stack direction="row" gap={2} justifyContent="flex-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            <Trans i18nKey="common.cancel">Cancel</Trans>
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <FormProvider {...formAPI}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="column" gap={1}>
          {/* Receiver Name */}
          <Field
            noMargin
            label={t('receivers.form.name', 'Name')}
            invalid={Boolean(errors.name)}
            error={errors.name?.message}
            required
          >
            <Input
              {...register('name', {
                required: t('receivers.form.name-required', 'Receiver name is required'),
                validate: (value) => {
                  if (!isReceiverNameUnique(value, existingReceivers, originalName)) {
                    return t('receivers.form.name-duplicate', 'A receiver with this name already exists');
                  }
                  return true;
                },
              })}
              placeholder={t('receivers.form.name-placeholder', 'Enter receiver name')}
              aria-label={t('receivers.form.name', 'Name')}
            />
          </Field>

          {/* Integrations */}
          <Box marginBottom={2}>
            <Stack direction="column" gap={0.5}>
              <Text variant="h5">
                <Trans i18nKey="receivers.form.integrations-title">Integrations</Trans>
              </Text>
              <Text variant="bodySmall" color="secondary">
                <Trans i18nKey="receivers.form.integrations-description">
                  Configure how alerts are sent when this receiver is triggered
                </Trans>
              </Text>
            </Stack>
          </Box>

          {fields.length === 0 && (
            <Alert title={t('receivers.form.no-integrations', 'No integrations')} severity="info">
              <Trans i18nKey="receivers.form.no-integrations-message">
                Add at least one integration to configure how alerts are delivered.
              </Trans>
            </Alert>
          )}

          {fields.map((field, index) => (
            <IntegrationEditor
              key={field.id}
              index={index}
              control={control}
              register={register}
              notifierTypeOptions={notifierTypeOptions}
              onRemove={() => remove(index)}
              onTypeChange={(type) => update(index, createDefaultIntegration(type))}
              canRemove={fields.length > 0}
            />
          ))}

          <Button type="button" variant="secondary" icon="plus" onClick={handleAddIntegration}>
            <Trans i18nKey="receivers.form.add-integration">Add integration</Trans>
          </Button>

          {/* Form Actions */}
          <MutationError
            error={saveError}
            fallbackTitle={saveErrorTitle ?? t('receivers.form.save-error', 'Failed to save receiver')}
            resource={t('receivers.resource-label', 'receivers')}
          />
          <Stack direction="row" gap={2} justifyContent="flex-end">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || isLoading}>
              <Trans i18nKey="common.cancel">Cancel</Trans>
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <Trans i18nKey="common.saving">Saving...</Trans>
              ) : isEditMode ? (
                <Trans i18nKey="receivers.form.update">Update receiver</Trans>
              ) : (
                <Trans i18nKey="receivers.form.create">Create receiver</Trans>
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </FormProvider>
  );
}

interface IntegrationEditorProps {
  index: number;
  control: ReturnType<typeof useForm<ReceiverFormValues>>['control'];
  register: ReturnType<typeof useForm<ReceiverFormValues>>['register'];
  notifierTypeOptions: Array<{ label: string; value: string; description: string }>;
  onRemove: () => void;
  onTypeChange: (type: CloudIntegrationType) => void;
  canRemove: boolean;
}

function IntegrationEditor({
  index,
  control,
  register,
  notifierTypeOptions,
  onRemove,
  onTypeChange,
  canRemove,
}: IntegrationEditorProps) {
  const integrationType = useWatch({
    control,
    name: `integrations.${index}.type`,
  });

  const comboboxOptions = useMemo(
    () => notifierTypeOptions.map((opt) => ({ label: opt.label, value: opt.value })),
    [notifierTypeOptions]
  );

  return (
    <Stack direction="column" gap={1}>
      {/* Header with type selector and remove button */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Field
          noMargin
          label={t('receivers.form.integration-type', 'Integration type')}
          style={{ flex: 1, marginRight: 16 }}
        >
          <Controller
            name={`integrations.${index}.type`}
            control={control}
            render={({ field: { value } }) => (
              <Combobox
                options={comboboxOptions}
                value={value}
                onChange={(selected) => {
                  const selectedType = selected?.value ?? 'webhook';
                  if (isCloudIntegrationType(selectedType)) {
                    onTypeChange(selectedType);
                  }
                }}
                placeholder={t('receivers.form.select-type', 'Select integration type')}
                aria-label={t('receivers.form.integration-type', 'Integration type')}
              />
            )}
          />
        </Field>
        {canRemove && (
          <IconButton
            name="trash-alt"
            tooltip={t('receivers.form.remove-integration', 'Remove integration')}
            onClick={onRemove}
            variant="destructive"
          />
        )}
      </Stack>

      {/* Send resolved toggle */}
      <Field
        noMargin
        label={t('receivers.form.send-resolved', 'Send resolved')}
        description={t('receivers.form.send-resolved-description', 'Send notifications when alerts are resolved')}
      >
        <Controller
          name={`integrations.${index}.sendResolved`}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Switch value={value} onChange={(e) => onChange(e.currentTarget.checked)} />
          )}
        />
      </Field>

      {/* Integration-specific settings */}
      {integrationType === 'discord' ? (
        <DiscordIntegrationForm index={index} />
      ) : integrationType === 'msteams' ? (
        <MSTeamsIntegrationForm index={index} />
      ) : integrationType === 'wechat' ? (
        <WeChatIntegrationForm index={index} />
      ) : integrationType === 'jira' ? (
        <JiraIntegrationForm index={index} />
      ) : integrationType === 'opsgenie' ? (
        <OpsgenieIntegrationForm index={index} />
      ) : integrationType === 'pushover' ? (
        <PushoverIntegrationForm index={index} />
      ) : integrationType === 'victorops' ? (
        <VictorOpsIntegrationForm index={index} />
      ) : integrationType === 'telegram' ? (
        <TelegramIntegrationForm index={index} />
      ) : integrationType === 'slack' ? (
        <SlackIntegrationForm index={index} />
      ) : integrationType === 'email' ? (
        <EmailIntegrationForm index={index} />
      ) : integrationType === 'sns' ? (
        <SNSIntegrationForm index={index} />
      ) : integrationType === 'pagerduty' ? (
        <PagerDutyIntegrationForm index={index} />
      ) : integrationType === 'webhook' ? (
        <WebhookIntegrationForm index={index} />
      ) : integrationType === 'webex' ? (
        <WebexIntegrationForm index={index} />
      ) : null}
    </Stack>
  );
}
