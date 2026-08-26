import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Checkbox, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
interface OpsgenieIntegrationFormProps {
  index: number;
}
type OpsgenieFieldPath = `integrations.${number}.settings.${string}`;
export function OpsgenieIntegrationForm({ index }: OpsgenieIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.opsgenie-settings">Opsgenie settings</Trans>
      </Text>
      <OpsgenieField
        register={register}
        name={`${path}.api_key`}
        label={t('receivers.form.opsgenie-api-key', 'API key')}
        type="password"
      />
      <OpsgenieField
        register={register}
        name={`${path}.api_url`}
        label={t('receivers.form.opsgenie-api-url', 'API URL')}
      />
      <OpsgenieField
        register={register}
        name={`${path}.message`}
        label={t('receivers.form.opsgenie-message', 'Message')}
      />
      <Field noMargin label={t('receivers.form.opsgenie-description', 'Description')}>
        <TextArea
          {...register(`${path}.description`)}
          rows={3}
          aria-label={t('receivers.form.opsgenie-description', 'Description')}
        />
      </Field>
      <OpsgenieField
        register={register}
        name={`${path}.source`}
        label={t('receivers.form.opsgenie-source', 'Source')}
      />
      <OpsgenieKeyValueMap name={`${path}.details`} label={t('receivers.form.opsgenie-details', 'Details')} />
      <OpsgenieField register={register} name={`${path}.tags`} label={t('receivers.form.opsgenie-tags', 'Tags')} />
      <OpsgenieField register={register} name={`${path}.note`} label={t('receivers.form.opsgenie-note', 'Note')} />
      <OpsgenieField
        register={register}
        name={`${path}.priority`}
        label={t('receivers.form.opsgenie-priority', 'Priority')}
      />
      <OpsgenieResponders name={`${path}.responders`} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.opsgenie-http-config">HTTP configuration</Trans>
          </Text>
          <OpsgenieField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.opsgenie-authorization-type', 'Authorization type')}
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.opsgenie-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.opsgenie-basic-auth-username', 'Basic authentication username')}
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.opsgenie-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.opsgenie-proxy-url', 'Proxy URL')}
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.opsgenie-no-proxy', 'No proxy')}
          />
          <OpsgenieCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.opsgenie-proxy-from-environment', 'Proxy from environment')}
          />
          <OpsgenieCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.opsgenie-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <OpsgenieCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.opsgenie-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.opsgenie-tls-server-name', 'TLS server name')}
          />
          <OpsgenieCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.opsgenie-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.opsgenie-min-tls-version', 'Minimum TLS version')}
          />
          <OpsgenieField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.opsgenie-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function OpsgenieField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: OpsgenieFieldPath;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const error = getFieldState(name, formState).error?.message;
  return (
    <Field noMargin label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function OpsgenieCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: OpsgenieFieldPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field noMargin label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Checkbox
            checked={(typeof value === 'boolean' ? value : undefined) ?? defaultChecked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            aria-label={label}
          />
        )}
      />
    </Field>
  );
}
function OpsgenieKeyValueMap({ name, label }: { name: OpsgenieFieldPath; label: string }) {
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
              {entries.map(([key, entryValue], itemIndex) => (
                <Stack key={`${key}-${itemIndex}`} direction="row" gap={1}>
                  <Input
                    value={key}
                    aria-label={t('receivers.form.opsgenie-detail-key', 'Detail key')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([currentKey, currentValue], index) => [
                            index === itemIndex ? event.currentTarget.value : currentKey,
                            currentValue,
                          ])
                        )
                      )
                    }
                  />
                  <Input
                    value={entryValue}
                    aria-label={t('receivers.form.opsgenie-detail-value', 'Detail value')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([currentKey, currentValue], index) => [
                            currentKey,
                            index === itemIndex ? event.currentTarget.value : currentValue,
                          ])
                        )
                      )
                    }
                  />
                  <IconButton
                    name="trash-alt"
                    type="button"
                    tooltip={t('receivers.form.remove-opsgenie-detail', 'Remove detail')}
                    onClick={() => onChange(Object.fromEntries(entries.filter((_, index) => index !== itemIndex)))}
                  />
                </Stack>
              ))}
              <Button
                type="button"
                variant="secondary"
                onClick={() => onChange({ ...Object.fromEntries(entries), [`key${entries.length + 1}`]: '' })}
              >
                <Trans i18nKey="receivers.form.add-opsgenie-detail">Add detail</Trans>
              </Button>
            </Stack>
          );
        }}
      />
    </Field>
  );
}
function OpsgenieResponders({ name }: { name: OpsgenieFieldPath }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field noMargin label={t('receivers.form.opsgenie-responders', 'Responders')}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => {
          const responders = Array.isArray(value) ? value.filter(isRecord) : [];
          return (
            <Stack direction="column" gap={1}>
              {responders.map((responder, responderIndex) => (
                <Stack key={responderIndex} direction="row" gap={1}>
                  {(['type', 'id', 'name', 'username'] as const).map((fieldName) => (
                    <Input
                      key={fieldName}
                      value={stringValue(responder[fieldName])}
                      aria-label={responderLabel(fieldName)}
                      onChange={(event) =>
                        onChange(
                          responders.map((current, index) =>
                            index === responderIndex ? { ...current, [fieldName]: event.currentTarget.value } : current
                          )
                        )
                      }
                    />
                  ))}
                  <IconButton
                    name="trash-alt"
                    type="button"
                    tooltip={t('receivers.form.remove-opsgenie-responder', 'Remove responder')}
                    onClick={() => onChange(responders.filter((_, index) => index !== responderIndex))}
                  />
                </Stack>
              ))}
              <Button type="button" variant="secondary" onClick={() => onChange([...responders, {}])}>
                <Trans i18nKey="receivers.form.add-opsgenie-responder">Add responder</Trans>
              </Button>
            </Stack>
          );
        }}
      />
    </Field>
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function responderLabel(field: string): string {
  if (field === 'type') {
    return t('receivers.form.opsgenie-responder-type', 'Responder type');
  }
  if (field === 'id') {
    return t('receivers.form.opsgenie-responder-id', 'Responder ID');
  }
  if (field === 'name') {
    return t('receivers.form.opsgenie-responder-name', 'Responder name');
  }
  return t('receivers.form.opsgenie-responder-username', 'Responder username');
}
