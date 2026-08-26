import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Checkbox, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
type Path = `integrations.${number}.settings.${string}`;
export function JiraIntegrationForm({ index }: { index: number }) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.jira-settings">Jira settings</Trans>
      </Text>
      <InputField register={register} name={`${path}.api_url`} label={t('receivers.form.jira-api-url', 'API URL')} />
      <InputField
        register={register}
        name={`${path}.project`}
        label={t('receivers.form.jira-project', 'Project key')}
      />
      <InputField
        register={register}
        name={`${path}.issue_type`}
        label={t('receivers.form.jira-issue-type', 'Issue type')}
      />
      <InputField register={register} name={`${path}.summary`} label={t('receivers.form.jira-summary', 'Summary')} />
      <Field noMargin label={t('receivers.form.jira-description', 'Description')}>
        <TextArea
          {...register(`${path}.description`)}
          rows={4}
          aria-label={t('receivers.form.jira-description', 'Description')}
        />
      </Field>
      <StringArray name={`${path}.labels`} label={t('receivers.form.jira-labels', 'Labels')} />
      <InputField register={register} name={`${path}.priority`} label={t('receivers.form.jira-priority', 'Priority')} />
      <InputField
        register={register}
        name={`${path}.reopen_transition`}
        label={t('receivers.form.jira-reopen-transition', 'Reopen transition')}
      />
      <InputField
        register={register}
        name={`${path}.resolve_transition`}
        label={t('receivers.form.jira-resolve-transition', 'Resolve transition')}
      />
      <InputField
        register={register}
        name={`${path}.wont_fix_resolution`}
        label={t('receivers.form.jira-wont-fix-resolution', "Won't fix resolution")}
      />
      <InputField
        register={register}
        name={`${path}.reopen_duration`}
        label={t('receivers.form.jira-reopen-duration', 'Reopen duration')}
      />
      <KeyValueMap name={`${path}.fields`} label={t('receivers.form.jira-fields', 'Fields')} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.jira-http-config">HTTP configuration</Trans>
          </Text>
          <InputField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.jira-authorization-type', 'Authorization type')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.jira-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.jira-basic-auth-username', 'Basic authentication username')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.jira-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.jira-proxy-url', 'Proxy URL')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.jira-no-proxy', 'No proxy')}
          />
          <Check
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.jira-proxy-from-environment', 'Proxy from environment')}
          />
          <Check
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.jira-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <Check
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.jira-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.jira-tls-server-name', 'TLS server name')}
          />
          <Check
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.jira-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.jira-min-tls-version', 'Minimum TLS version')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.jira-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function InputField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: Path;
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
function Check({ name, label, defaultChecked = false }: { name: Path; label: string; defaultChecked?: boolean }) {
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
function StringArray({ name, label }: { name: Path; label: string }) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field noMargin label={label}>
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
function KeyValueMap({ name, label }: { name: Path; label: string }) {
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
              {entries.map(([key, itemValue], index) => (
                <Stack key={`${key}-${index}`} direction="row" gap={1}>
                  <Input
                    value={key}
                    aria-label={t('receivers.form.jira-field-key', 'Field key')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([entryKey, entryValue], entryIndex) => [
                            entryIndex === index ? event.currentTarget.value : entryKey,
                            entryValue,
                          ])
                        )
                      )
                    }
                  />
                  <Input
                    value={itemValue}
                    aria-label={t('receivers.form.jira-field-value', 'Field value')}
                    onChange={(event) =>
                      onChange(
                        Object.fromEntries(
                          entries.map(([entryKey, entryValue], entryIndex) => [
                            entryKey,
                            entryIndex === index ? event.currentTarget.value : entryValue,
                          ])
                        )
                      )
                    }
                  />
                  <IconButton
                    name="trash-alt"
                    type="button"
                    tooltip={t('receivers.form.remove-jira-field', 'Remove field')}
                    aria-label={t('receivers.form.remove-jira-field', 'Remove field')}
                    onClick={() =>
                      onChange(Object.fromEntries(entries.filter((_, entryIndex) => entryIndex !== index)))
                    }
                  />
                </Stack>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onChange({ ...Object.fromEntries(entries), '': '' })}
              >
                <Trans i18nKey="receivers.form.add-jira-field">Add field</Trans>
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
    Object.values(value).every((item) => typeof item === 'string')
  );
}
