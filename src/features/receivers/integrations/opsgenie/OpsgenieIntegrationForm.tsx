import React from 'react';
import type { FieldPath } from 'react-hook-form';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, IconButton, Input, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { OpsgenieSettingsFormValues } from './opsgenie.schema';

type OpsgenieFormValues = IntegrationFormValues<OpsgenieSettingsFormValues>;
const { CheckboxField, ControlledField, TextAreaField, TextField } = createFormFields<OpsgenieFormValues>();
interface OpsgenieIntegrationFormProps {
  index: number;
}
type OpsgenieFieldPath = FieldPath<OpsgenieFormValues>;
export function OpsgenieIntegrationForm({ index }: OpsgenieIntegrationFormProps) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.opsgenie-settings">Opsgenie settings</Trans>
      </Text>
      <TextField name={`${path}.api_key`} label={t('receivers.form.opsgenie-api-key', 'API key')} type="password" />
      <TextField name={`${path}.api_url`} label={t('receivers.form.opsgenie-api-url', 'API URL')} />
      <TextField name={`${path}.message`} label={t('receivers.form.opsgenie-message', 'Message')} />
      <TextAreaField
        name={`${path}.description`}
        label={t('receivers.form.opsgenie-description', 'Description')}
        rows={3}
      />
      <TextField name={`${path}.source`} label={t('receivers.form.opsgenie-source', 'Source')} />
      <OpsgenieKeyValueMap name={`${path}.details`} label={t('receivers.form.opsgenie-details', 'Details')} />
      <TextField name={`${path}.tags`} label={t('receivers.form.opsgenie-tags', 'Tags')} />
      <TextField name={`${path}.note`} label={t('receivers.form.opsgenie-note', 'Note')} />
      <TextField name={`${path}.priority`} label={t('receivers.form.opsgenie-priority', 'Priority')} />
      <OpsgenieResponders name={`${path}.responders`} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.opsgenie-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.opsgenie-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.opsgenie-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.opsgenie-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.opsgenie-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.opsgenie-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.opsgenie-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.opsgenie-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.opsgenie-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.opsgenie-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.opsgenie-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.opsgenie-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.opsgenie-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.opsgenie-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function OpsgenieKeyValueMap({ name, label }: { name: OpsgenieFieldPath; label: string }) {
  return (
    <ControlledField name={name} label={label}>
      {({ value, onChange }) => {
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
    </ControlledField>
  );
}
function OpsgenieResponders({ name }: { name: OpsgenieFieldPath }) {
  return (
    <ControlledField name={name} label={t('receivers.form.opsgenie-responders', 'Responders')}>
      {({ value, onChange }) => {
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
    </ControlledField>
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
