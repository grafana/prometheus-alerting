import React, { useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller, useWatch, FormProvider } from 'react-hook-form';
import { t, Trans } from '@grafana/i18n';
import {
  Button,
  Field,
  Input,
  Stack,
  Combobox,
  Switch,
  TextArea,
  IconButton,
  Alert,
  Box,
  Text,
  Checkbox,
} from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';

import {
  ReceiverFormValues,
  receiverToFormValues,
  formValuesToReceiver,
  createDefaultReceiverFormValues,
  createDefaultIntegration,
  getNotifierForType,
  isReceiverNameUnique,
} from '../utils/receiverFormTransform';
import { NotificationChannelOption, getNotifierTypeOptions } from '../utils/notifierTypes';

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

  const defaultValues = useMemo(() => {
    return receiver ? receiverToFormValues(receiver) : createDefaultReceiverFormValues();
  }, [receiver]);

  const formAPI = useForm<ReceiverFormValues>({
    defaultValues,
    mode: 'onBlur',
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formAPI;

  const { fields, append, remove } = useFieldArray({
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
              register={register}
              notifierTypeOptions={notifierTypeOptions}
              onRemove={() => remove(index)}
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
  register: ReturnType<typeof useForm<ReceiverFormValues>>['register'];
  notifierTypeOptions: Array<{ label: string; value: string; description: string }>;
  onRemove: () => void;
  canRemove: boolean;
}

function IntegrationEditor({
  index,
  control,
  register,
  notifierTypeOptions,
  onRemove,
  canRemove,
}: IntegrationEditorProps) {
  const integrationType = useWatch({
    control,
    name: `integrations.${index}.type`,
  });

  const notifier = getNotifierForType(integrationType);
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
            render={({ field: { onChange, value } }) => (
              <Combobox
                options={comboboxOptions}
                value={value}
                onChange={(selected) => onChange(selected?.value ?? 'webhook')}
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
      {notifier && (
        <Box padding={2} borderColor="weak" borderStyle="solid">
          <IntegrationFields notifier={notifier} index={index} control={control} register={register} />
        </Box>
      )}
    </Stack>
  );
}

interface IntegrationFieldsProps {
  notifier: ReturnType<typeof getNotifierForType>;
  index: number;
  control: ReturnType<typeof useForm<ReceiverFormValues>>['control'];
  register: ReturnType<typeof useForm<ReceiverFormValues>>['register'];
}

function IntegrationFields({ notifier, index, control, register }: IntegrationFieldsProps) {
  if (!notifier) {
    return null;
  }

  return (
    <Stack direction="column" gap={2}>
      <Text variant="h6">{notifier.heading}</Text>
      {notifier.options.map((option) => (
        <OptionField
          key={option.propertyName}
          option={option}
          index={index}
          control={control}
          register={register}
          basePath={`integrations.${index}.settings`}
        />
      ))}
    </Stack>
  );
}

interface OptionFieldProps {
  option: NotificationChannelOption;
  index: number;
  control: ReturnType<typeof useForm<ReceiverFormValues>>['control'];
  register: ReturnType<typeof useForm<ReceiverFormValues>>['register'];
  basePath: string;
}

function OptionField({ option, index, control, register, basePath }: OptionFieldProps) {
  const fieldPath = `${basePath}.${option.propertyName}` as const;

  // Render subform fields (like http_config, tls_config) with a section header
  if (option.element === 'subform' || option.element === 'subform_array') {
    if (option.element === 'subform' && option.subformOptions) {
      return (
        <Box marginTop={2}>
          <Stack direction="column" gap={2}>
            <Text variant="bodySmall" weight="medium" color="secondary">
              {option.label}
            </Text>
            {option.subformOptions.map((subOption) => (
              <OptionField
                key={subOption.propertyName}
                option={subOption}
                index={index}
                control={control}
                register={register}
                basePath={`${basePath}.${option.propertyName}`}
              />
            ))}
          </Stack>
        </Box>
      );
    }
    return null;
  }

  // Checkbox field
  if (option.element === 'checkbox') {
    return (
      <Field label={option.label} description={option.description}>
        <Controller
          name={fieldPath as `integrations.${number}.settings.${string}`}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => onChange(e.currentTarget.checked)}
              aria-label={option.label}
            />
          )}
        />
      </Field>
    );
  }

  // Select field
  if (option.element === 'select' && option.selectOptions) {
    const selectOptions = option.selectOptions;
    return (
      <Field label={option.label} description={option.description}>
        <Controller
          name={fieldPath as `integrations.${number}.settings.${string}`}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Combobox
              options={selectOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
              value={value as string}
              onChange={(selected) => onChange(selected?.value ?? '')}
              aria-label={option.label}
            />
          )}
        />
      </Field>
    );
  }

  // Textarea field
  if (option.element === 'textarea') {
    return (
      <Field label={option.label} description={option.description}>
        <TextArea
          {...register(fieldPath as `integrations.${number}.settings.${string}`)}
          placeholder={option.placeholder}
          rows={3}
          aria-label={option.label}
        />
      </Field>
    );
  }

  // Default: Input field
  return (
    <Field label={option.label} description={option.description} required={option.required}>
      <Input
        {...register(fieldPath as `integrations.${number}.settings.${string}`, {
          required: option.required ? t('receivers.form.field-required', 'This field is required') : false,
          setValueAs: option.setValueAs,
        })}
        type={option.inputType ?? 'text'}
        placeholder={option.placeholder}
        aria-label={option.label}
      />
    </Field>
  );
}
