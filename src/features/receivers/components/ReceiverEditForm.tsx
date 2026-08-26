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
import { getNotifierTypeOptions } from '../utils/notifierTypes';
import { createReceiverFormSchema } from '../utils/receiverFormSchema';
import { CloudIntegrationType, isCloudIntegrationType } from '../utils/cloudIntegrationTypes';

import { WebhookIntegrationForm } from '../integrations/webhook/WebhookIntegrationForm';

import { WebexIntegrationForm } from '../integrations/webex/WebexIntegrationForm';

import { PagerDutyIntegrationForm } from '../integrations/pagerduty/PagerDutyIntegrationForm';

import { SNSIntegrationForm } from '../integrations/sns/SNSIntegrationForm';

import { EmailIntegrationForm } from '../integrations/email/EmailIntegrationForm';

import { SlackIntegrationForm } from '../integrations/slack/SlackIntegrationForm';

import { OpsgenieIntegrationForm } from '../integrations/opsgenie/OpsgenieIntegrationForm';

import { PushoverIntegrationForm } from '../integrations/pushover/PushoverIntegrationForm';

import { VictorOpsIntegrationForm } from '../integrations/victorops/VictorOpsIntegrationForm';

import { TelegramIntegrationForm } from '../integrations/telegram/TelegramIntegrationForm';

import { DiscordIntegrationForm } from '../integrations/discord/DiscordIntegrationForm';

import { MSTeamsIntegrationForm } from '../integrations/msteams/MSTeamsIntegrationForm';

import { WeChatIntegrationForm } from '../integrations/wechat/WeChatIntegrationForm';

import { JiraIntegrationForm } from '../integrations/jira/JiraIntegrationForm';

interface ReceiverEditFormProps {
  receiver?: Receiver;
  existingReceivers: Receiver[];
  onSave: (receiver: Receiver) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ReceiverEditForm({
  receiver,
  existingReceivers,
  onSave,
  onCancel,
  isLoading = false,
}: ReceiverEditFormProps) {
  const isEditMode = Boolean(receiver);
  const originalName = receiver?.name;

  const defaultValues = useMemo(
    () => (receiver ? receiverToFormValues(receiver) : createDefaultReceiverFormValues()),
    [receiver]
  );

  const receiverFormSchema = useMemo(() => createReceiverFormSchema(), []);
  const formAPI = useForm<ReceiverFormValues>({
    defaultValues,
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

  const notifierTypeOptions = useMemo(() => getNotifierTypeOptions(), []);

  return (
    <FormProvider {...formAPI}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack direction="column" gap={3}>
          {/* Receiver Name */}
          <Field
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
              notifierTypeOptions={notifierTypeOptions}
              onRemove={() => remove(index)}
              onTypeChange={(type) => update(index, createDefaultIntegration(type))}
              canRemove={fields.length > 1}
            />
          ))}

          <Button type="button" variant="secondary" icon="plus" onClick={handleAddIntegration}>
            <Trans i18nKey="receivers.form.add-integration">Add integration</Trans>
          </Button>

          {/* Form Actions */}
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
  notifierTypeOptions: Array<{ label: string; value: string; description: string }>;
  onRemove: () => void;
  onTypeChange: (type: CloudIntegrationType) => void;
  canRemove: boolean;
}

function IntegrationEditor({
  index,
  control,
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
    <Stack direction="column" gap={2}>
      {/* Header with type selector and remove button */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Field label={t('receivers.form.integration-type', 'Integration type')} style={{ flex: 1, marginRight: 16 }}>
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

      {/* Settings box - only the actual integration settings are boxed */}
      <Box padding={2} borderColor="weak" borderStyle="solid">
        {integrationType === 'webhook' ? (
          <WebhookIntegrationForm index={index} />
        ) : integrationType === 'webex' ? (
          <WebexIntegrationForm index={index} />
        ) : integrationType === 'pagerduty' ? (
          <PagerDutyIntegrationForm index={index} />
        ) : integrationType === 'sns' ? (
          <SNSIntegrationForm index={index} />
        ) : integrationType === 'email' ? (
          <EmailIntegrationForm index={index} />
        ) : integrationType === 'slack' ? (
          <SlackIntegrationForm index={index} />
        ) : integrationType === 'opsgenie' ? (
          <OpsgenieIntegrationForm index={index} />
        ) : integrationType === 'pushover' ? (
          <PushoverIntegrationForm index={index} />
        ) : integrationType === 'victorops' ? (
          <VictorOpsIntegrationForm index={index} />
        ) : integrationType === 'telegram' ? (
          <TelegramIntegrationForm index={index} />
        ) : integrationType === 'discord' ? (
          <DiscordIntegrationForm index={index} />
        ) : integrationType === 'msteams' ? (
          <MSTeamsIntegrationForm index={index} />
        ) : integrationType === 'wechat' ? (
          <WeChatIntegrationForm index={index} />
        ) : integrationType === 'jira' ? (
          <JiraIntegrationForm index={index} />
        ) : null}
      </Box>
    </Stack>
  );
}
