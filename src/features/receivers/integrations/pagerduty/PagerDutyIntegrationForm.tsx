import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { useFormContext, type FieldPath } from 'react-hook-form';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { PagerDutySettingsFormValues } from './pagerduty.schema';

type PagerDutyFormValues = IntegrationFormValues<PagerDutySettingsFormValues>;
const { CheckboxField, ControlledField, TextField } = createFormFields<PagerDutyFormValues>();

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

interface PagerDutyIntegrationFormProps {
  index: number;
}

type PagerDutySettingsPath = `integrations.${number}.settings`;
type PagerDutyFieldPath = FieldPath<PagerDutyFormValues>;

export function PagerDutyIntegrationForm({ index }: PagerDutyIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` satisfies PagerDutySettingsPath;

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.pagerduty-settings">PagerDuty settings</Trans>
      </Text>
      <TextField
        name={`${path}.routing_key`}
        label={t('receivers.form.pagerduty-routing-key', 'Routing key')}
        type="password"
      />
      <TextField
        name={`${path}.service_key`}
        label={t('receivers.form.pagerduty-service-key', 'Service key')}
        type="password"
      />
      <TextField name={`${path}.url`} label={t('receivers.form.pagerduty-url', 'URL')} />
      <TextField
        name={`${path}.client`}
        label={t('receivers.form.pagerduty-client', 'Client')}
        placeholder={t('receivers.form.pagerduty-client-placeholder', '{{ template "pagerduty.default.client" . }}')}
      />
      <TextField
        name={`${path}.client_url`}
        label={t('receivers.form.pagerduty-client-url', 'Client URL')}
        placeholder={t(
          'receivers.form.pagerduty-client-url-placeholder',
          '{{ template "pagerduty.default.clientURL" . }}'
        )}
      />
      <Field noMargin label={t('receivers.form.pagerduty-description', 'Description')}>
        <TextArea
          {...register(`${path}.description`)}
          rows={3}
          placeholder={t(
            'receivers.form.pagerduty-description-placeholder',
            '{{ template "pagerduty.default.description" . }}'
          )}
          aria-label={t('receivers.form.pagerduty-description', 'Description')}
        />
      </Field>
      <TextField
        name={`${path}.severity`}
        label={t('receivers.form.pagerduty-severity', 'Severity')}
        placeholder={t('receivers.form.pagerduty-severity-placeholder', 'error')}
      />
      <TextField name={`${path}.class`} label={t('receivers.form.pagerduty-class', 'Class')} />
      <TextField name={`${path}.component`} label={t('receivers.form.pagerduty-component', 'Component')} />
      <TextField name={`${path}.group`} label={t('receivers.form.pagerduty-group', 'Group')} />
      <TextField name={`${path}.source`} label={t('receivers.form.pagerduty-source', 'Source')} />

      <PagerDutyKeyValueMap name={`${path}.details`} label={t('receivers.form.pagerduty-details', 'Details')} />
      <PagerDutyObjectArray
        name={`${path}.images`}
        label={t('receivers.form.pagerduty-images', 'Images')}
        fields={[
          ['src', t('receivers.form.pagerduty-image-source', 'Source')],
          ['href', t('receivers.form.pagerduty-image-url', 'URL')],
          ['alt', t('receivers.form.pagerduty-image-alt', 'Alt')],
        ]}
      />
      <PagerDutyObjectArray
        name={`${path}.links`}
        label={t('receivers.form.pagerduty-links', 'Links')}
        fields={[
          ['href', t('receivers.form.pagerduty-link-url', 'URL')],
          ['text', t('receivers.form.pagerduty-link-text', 'Text')],
        ]}
      />

      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.pagerduty-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.pagerduty-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.pagerduty-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.pagerduty-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.pagerduty-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.pagerduty-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.pagerduty-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.pagerduty-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.pagerduty-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.pagerduty-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.pagerduty-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.pagerduty-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.pagerduty-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.pagerduty-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function PagerDutyKeyValueMap({ name, label }: { name: PagerDutyFieldPath; label: string }) {
  return (
    <ControlledField name={name} label={label}>
      {({ value, onChange }) => {
        const entries = isStringRecord(value) ? Object.entries(value) : [];
        return (
          <Stack direction="column" gap={1}>
            {entries.map(([key, entryValue], entryIndex) => (
              <Stack key={`${key}-${entryIndex}`} direction="row" gap={1}>
                <Input
                  value={key}
                  aria-label={t('receivers.form.pagerduty-detail-key', 'Detail key')}
                  onChange={(event) => onChange(renameRecordKey(entries, entryIndex, event.currentTarget.value))}
                />
                <Input
                  value={entryValue}
                  aria-label={t('receivers.form.pagerduty-detail-value', 'Detail value')}
                  onChange={(event) => onChange(updateRecordValue(entries, entryIndex, event.currentTarget.value))}
                />
                <IconButton
                  name="trash-alt"
                  type="button"
                  tooltip={t('receivers.form.remove-pagerduty-detail', 'Remove detail')}
                  onClick={() => onChange(Object.fromEntries(entries.filter((_, index) => index !== entryIndex)))}
                />
              </Stack>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChange({ ...Object.fromEntries(entries), [nextRecordKey(entries)]: '' })}
            >
              <Trans i18nKey="receivers.form.add-pagerduty-detail">Add detail</Trans>
            </Button>
          </Stack>
        );
      }}
    </ControlledField>
  );
}

function PagerDutyObjectArray({
  name,
  label,
  fields,
}: {
  name: PagerDutyFieldPath;
  label: string;
  fields: Array<[string, string]>;
}) {
  return (
    <ControlledField name={name} label={label}>
      {({ value, onChange }) => {
        const items = Array.isArray(value) ? value.filter(isRecord) : [];
        return (
          <Stack direction="column" gap={1}>
            {items.map((item, itemIndex) => (
              <Stack key={itemIndex} direction="row" gap={1}>
                {fields.map(([fieldName, fieldLabel]) => (
                  <Input
                    key={fieldName}
                    value={typeof item[fieldName] === 'string' ? item[fieldName] : ''}
                    aria-label={fieldLabel}
                    onChange={(event) =>
                      onChange(
                        items.map((current, index) =>
                          index === itemIndex ? { ...current, [fieldName]: event.currentTarget.value } : current
                        )
                      )
                    }
                  />
                ))}
                <IconButton
                  name="trash-alt"
                  type="button"
                  tooltip={t('receivers.form.remove-pagerduty-item', 'Remove item')}
                  onClick={() => onChange(items.filter((_, index) => index !== itemIndex))}
                />
              </Stack>
            ))}
            <Button type="button" variant="secondary" onClick={() => onChange([...items, {}])}>
              <Trans i18nKey="receivers.form.add-pagerduty-item">Add item</Trans>
            </Button>
          </Stack>
        );
      }}
    </ControlledField>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
function renameRecordKey(entries: Array<[string, string]>, index: number, key: string): Record<string, string> {
  return Object.fromEntries(
    entries.map(([currentKey, value], entryIndex) => [entryIndex === index ? key : currentKey, value])
  );
}
function updateRecordValue(entries: Array<[string, string]>, index: number, value: string): Record<string, string> {
  return Object.fromEntries(
    entries.map(([key, currentValue], entryIndex) => [key, entryIndex === index ? value : currentValue])
  );
}
function nextRecordKey(entries: Array<[string, string]>): string {
  let index = entries.length + 1;
  while (entries.some(([key]) => key === `key${index}`)) {
    index += 1;
  }
  return `key${index}`;
}
