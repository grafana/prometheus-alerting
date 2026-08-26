import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Checkbox, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

interface EmailIntegrationFormProps {
  index: number;
}
type EmailFieldPath = `integrations.${number}.settings.${string}`;

export function EmailIntegrationForm({ index }: EmailIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.email-settings">Email settings</Trans>
      </Text>
      <EmailField register={register} name={`${path}.to`} label={t('receivers.form.email-to', 'To')} />
      <EmailField register={register} name={`${path}.from`} label={t('receivers.form.email-from', 'From')} />
      <EmailField
        register={register}
        name={`${path}.smarthost`}
        label={t('receivers.form.email-smarthost', 'SMTP host')}
      />
      <EmailField register={register} name={`${path}.hello`} label={t('receivers.form.email-hello', 'Hello')} />
      <EmailField
        register={register}
        name={`${path}.auth_username`}
        label={t('receivers.form.email-auth-username', 'Username')}
      />
      <EmailField
        register={register}
        name={`${path}.auth_password`}
        label={t('receivers.form.email-auth-password', 'Password')}
        type="password"
      />
      <EmailField
        register={register}
        name={`${path}.auth_secret`}
        label={t('receivers.form.email-auth-secret', 'Secret')}
        type="password"
      />
      <EmailField
        register={register}
        name={`${path}.auth_identity`}
        label={t('receivers.form.email-auth-identity', 'Identity')}
      />
      <EmailCheckbox name={`${path}.require_tls`} label={t('receivers.form.email-require-tls', 'Require TLS')} />
      <Field noMargin label={t('receivers.form.email-html', 'Email HTML body')}>
        <TextArea
          {...register(`${path}.html`)}
          rows={4}
          placeholder={t('receivers.form.email-html-placeholder', '{{ template "email.default.html" . }}')}
          aria-label={t('receivers.form.email-html', 'Email HTML body')}
        />
      </Field>
      <Field noMargin label={t('receivers.form.email-text', 'Email text body')}>
        <TextArea
          {...register(`${path}.text`)}
          rows={4}
          aria-label={t('receivers.form.email-text', 'Email text body')}
        />
      </Field>
      <EmailKeyValueMap name={`${path}.headers`} label={t('receivers.form.email-headers', 'Headers')} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.email-tls-config">TLS configuration</Trans>
          </Text>
          <EmailField
            register={register}
            name={`${path}.tls_config.server_name`}
            label={t('receivers.form.email-tls-server-name', 'TLS server name')}
          />
          <EmailCheckbox
            name={`${path}.tls_config.insecure_skip_verify`}
            label={t('receivers.form.email-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <EmailField
            register={register}
            name={`${path}.tls_config.min_version`}
            label={t('receivers.form.email-min-tls-version', 'Minimum TLS version')}
          />
          <EmailField
            register={register}
            name={`${path}.tls_config.max_version`}
            label={t('receivers.form.email-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function EmailField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: EmailFieldPath;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const fieldError = getFieldState(name, formState).error?.message;
  return (
    <Field noMargin label={label} invalid={Boolean(fieldError)} error={fieldError}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function EmailCheckbox({ name, label }: { name: EmailFieldPath; label: string }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field noMargin label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Checkbox
            checked={typeof value === 'boolean' ? value : false}
            onChange={(event) => onChange(event.currentTarget.checked)}
            aria-label={label}
          />
        )}
      />
    </Field>
  );
}
function EmailKeyValueMap({ name, label }: { name: EmailFieldPath; label: string }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field noMargin label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => {
          const entries = isStringRecord(value) ? Object.entries(value) : [];
          return (
            <Stack direction="column" gap={1}>
              {entries.map(([key, entryValue], entryIndex) => (
                <Stack key={`${key}-${entryIndex}`} direction="row" gap={1}>
                  <Input
                    value={key}
                    aria-label={t('receivers.form.email-header-key', 'Header key')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([currentKey, currentValue], index) => [
                            index === entryIndex ? event.currentTarget.value : currentKey,
                            currentValue,
                          ])
                        )
                      )
                    }
                  />
                  <Input
                    value={entryValue}
                    aria-label={t('receivers.form.email-header-value', 'Header value')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([currentKey, currentValue], index) => [
                            currentKey,
                            index === entryIndex ? event.currentTarget.value : currentValue,
                          ])
                        )
                      )
                    }
                  />
                  <IconButton
                    name="trash-alt"
                    type="button"
                    tooltip={t('receivers.form.remove-email-header', 'Remove header')}
                    onClick={() => onChange(Object.fromEntries(entries.filter((_, index) => index !== entryIndex)))}
                  />
                </Stack>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => onChange({ ...Object.fromEntries(entries), [`Header-${entries.length + 1}`]: '' })}
              >
                <Trans i18nKey="receivers.form.add-email-header">Add header</Trans>
              </Button>
            </Stack>
          );
        }}
      />
    </Field>
  );
}
function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}
