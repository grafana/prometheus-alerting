import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Checkbox, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

interface SlackIntegrationFormProps {
  index: number;
}
type SlackFieldPath = `integrations.${number}.settings.${string}`;

export function SlackIntegrationForm({ index }: SlackIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={3}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.slack-settings">Slack settings</Trans>
      </Text>
      <SlackField
        register={register}
        name={`${path}.api_url`}
        label={t('receivers.form.slack-api-url', 'Webhook URL')}
        type="password"
      />
      <SlackField register={register} name={`${path}.channel`} label={t('receivers.form.slack-channel', 'Channel')} />
      <SlackField
        register={register}
        name={`${path}.icon_emoji`}
        label={t('receivers.form.slack-icon-emoji', 'Emoji icon')}
      />
      <SlackField
        register={register}
        name={`${path}.icon_url`}
        label={t('receivers.form.slack-icon-url', 'Icon URL')}
      />
      <SlackCheckbox name={`${path}.link_names`} label={t('receivers.form.slack-link-names', 'Names link')} />
      <SlackField
        register={register}
        name={`${path}.username`}
        label={t('receivers.form.slack-username', 'Username')}
      />
      <SlackField
        register={register}
        name={`${path}.callback_id`}
        label={t('receivers.form.slack-callback-id', 'Callback ID')}
      />
      <SlackField register={register} name={`${path}.color`} label={t('receivers.form.slack-color', 'Color')} />
      <SlackField
        register={register}
        name={`${path}.fallback`}
        label={t('receivers.form.slack-fallback', 'Fallback')}
      />
      <SlackField register={register} name={`${path}.footer`} label={t('receivers.form.slack-footer', 'Footer')} />
      <SlackStringArray name={`${path}.mrkdwn_in`} label={t('receivers.form.slack-mrkdwn-in', 'Mrkdwn fields')} />
      <Field label={t('receivers.form.slack-pretext', 'Pre-text')}>
        <TextArea
          {...register(`${path}.pretext`)}
          rows={2}
          aria-label={t('receivers.form.slack-pretext', 'Pre-text')}
        />
      </Field>
      <SlackCheckbox name={`${path}.short_fields`} label={t('receivers.form.slack-short-fields', 'Short fields')} />
      <Field label={t('receivers.form.slack-text', 'Message body')}>
        <TextArea {...register(`${path}.text`)} rows={4} aria-label={t('receivers.form.slack-text', 'Message body')} />
      </Field>
      <SlackField register={register} name={`${path}.title`} label={t('receivers.form.slack-title', 'Title')} />
      <SlackField
        register={register}
        name={`${path}.title_link`}
        label={t('receivers.form.slack-title-link', 'Title link')}
      />
      <SlackField
        register={register}
        name={`${path}.image_url`}
        label={t('receivers.form.slack-image-url', 'Image URL')}
      />
      <SlackField
        register={register}
        name={`${path}.thumb_url`}
        label={t('receivers.form.slack-thumb-url', 'Thumbnail URL')}
      />
      <SlackActions name={`${path}.actions`} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={2}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.slack-http-config">HTTP configuration</Trans>
          </Text>
          <SlackField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.slack-authorization-type', 'Authorization type')}
          />
          <SlackField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.slack-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <SlackField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.slack-basic-auth-username', 'Basic authentication username')}
          />
          <SlackField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.slack-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <SlackField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.slack-proxy-url', 'Proxy URL')}
          />
          <SlackField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.slack-no-proxy', 'No proxy')}
          />
          <SlackCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.slack-proxy-from-environment', 'Proxy from environment')}
          />
          <SlackCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.slack-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <SlackCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.slack-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <SlackField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.slack-tls-server-name', 'TLS server name')}
          />
          <SlackCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.slack-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <SlackField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.slack-min-tls-version', 'Minimum TLS version')}
          />
          <SlackField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.slack-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function SlackField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: SlackFieldPath;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const fieldError = getFieldState(name, formState).error?.message;
  return (
    <Field label={label} invalid={Boolean(fieldError)} error={fieldError}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function SlackCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: SlackFieldPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field label={label}>
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
function SlackStringArray({ name, label }: { name: SlackFieldPath; label: string }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Input
            value={Array.isArray(value) ? value.join(', ') : ''}
            aria-label={label}
            onChange={(event) =>
              onChange(
                event.currentTarget.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
        )}
      />
    </Field>
  );
}
function SlackActions({ name }: { name: SlackFieldPath }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field label={t('receivers.form.slack-actions', 'Actions')}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => {
          const actions = Array.isArray(value) ? value.filter(isRecord) : [];
          return (
            <Stack direction="column" gap={2}>
              {actions.map((action, actionIndex) => (
                <Box key={actionIndex} padding={2} borderColor="weak" borderStyle="solid">
                  <Stack direction="column" gap={1}>
                    {(['text', 'type', 'url', 'name', 'value', 'style'] as const).map((fieldName) => (
                      <Input
                        key={fieldName}
                        value={stringValue(action[fieldName])}
                        aria-label={actionLabel(fieldName)}
                        onChange={(event) =>
                          onChange(updateAction(actions, actionIndex, fieldName, event.currentTarget.value))
                        }
                      />
                    ))}
                    <Text variant="bodySmall" weight="medium">
                      <Trans i18nKey="receivers.form.slack-action-confirm">Confirmation</Trans>
                    </Text>
                    {(['text', 'dismiss_text', 'ok_text', 'title'] as const).map((fieldName) => (
                      <Input
                        key={fieldName}
                        value={stringValue(isRecord(action.confirm) ? action.confirm[fieldName] : undefined)}
                        aria-label={confirmLabel(fieldName)}
                        onChange={(event) =>
                          onChange(updateActionConfirm(actions, actionIndex, fieldName, event.currentTarget.value))
                        }
                      />
                    ))}
                    <IconButton
                      name="trash-alt"
                      type="button"
                      tooltip={t('receivers.form.remove-slack-action', 'Remove action')}
                      onClick={() => onChange(actions.filter((_, index) => index !== actionIndex))}
                    />
                  </Stack>
                </Box>
              ))}
              <Button type="button" variant="secondary" onClick={() => onChange([...actions, {}])}>
                <Trans i18nKey="receivers.form.add-slack-action">Add action</Trans>
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
function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
function updateAction(actions: Array<Record<string, unknown>>, index: number, field: string, value: string) {
  return actions.map((action, actionIndex) => (actionIndex === index ? { ...action, [field]: value } : action));
}
function updateActionConfirm(actions: Array<Record<string, unknown>>, index: number, field: string, value: string) {
  return actions.map((action, actionIndex) =>
    actionIndex === index
      ? { ...action, confirm: { ...(isRecord(action.confirm) ? action.confirm : {}), [field]: value } }
      : action
  );
}
function actionLabel(field: string): string {
  switch (field) {
    case 'text':
      return t('receivers.form.slack-action-text', 'Action text');
    case 'type':
      return t('receivers.form.slack-action-type', 'Action type');
    case 'url':
      return t('receivers.form.slack-action-url', 'Action URL');
    case 'name':
      return t('receivers.form.slack-action-name', 'Action name');
    case 'value':
      return t('receivers.form.slack-action-value', 'Action value');
    default:
      return t('receivers.form.slack-action-style', 'Action style');
  }
}
function confirmLabel(field: string): string {
  switch (field) {
    case 'text':
      return t('receivers.form.slack-confirm-text', 'Confirmation text');
    case 'dismiss_text':
      return t('receivers.form.slack-confirm-dismiss-text', 'Confirmation dismiss text');
    case 'ok_text':
      return t('receivers.form.slack-confirm-ok-text', 'Confirmation OK text');
    default:
      return t('receivers.form.slack-confirm-title', 'Confirmation title');
  }
}
