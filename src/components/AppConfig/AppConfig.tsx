import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { AppPluginMeta, PluginConfigPageProps, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, SecretInput } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { testIds } from '../testIds';

type AppPluginSettings = {
  apiUrl?: string;
};

type State = {
  // The URL to reach our custom API.
  apiUrl: string;
  // Tells us if the API key secret is set.
  isApiKeySet: boolean;
  // A secret key for our custom API.
  apiKey: string;
};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const AppConfig = ({ plugin }: AppConfigProps) => {
  const { enabled, pinned, jsonData, secureJsonFields } = plugin.meta;
  const [state, setState] = useState<State>({
    apiUrl: jsonData?.apiUrl || '',
    apiKey: '',
    isApiKeySet: Boolean(secureJsonFields?.apiKey),
  });

  const isSubmitDisabled = Boolean(!state.apiUrl || (!state.isApiKeySet && !state.apiKey));

  const onResetApiKey = () =>
    setState({
      ...state,
      apiKey: '',
      isApiKeySet: false,
    });

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.value.trim(),
    });
  };

  const onSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    await updatePluginAndReload(plugin.meta.id, {
      enabled,
      pinned,
      jsonData: {
        apiUrl: state.apiUrl,
      },
      // This cannot be queried later by the frontend.
      // We don't want to override it in case it was set previously and left untouched now.
      secureJsonData: state.isApiKeySet
        ? undefined
        : {
            apiKey: state.apiKey,
          },
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <FieldSet label={t('app-config.api-settings.title', 'API Settings')}>
        <Field
          label={t('app-config.api-key.label', 'API Key')}
          description={t('app-config.api-key.description', 'A secret key for authenticating to our custom API')}
        >
          <SecretInput
            width={60}
            id="config-api-key"
            data-testid={testIds.appConfig.apiKey}
            name="apiKey"
            value={state.apiKey}
            isConfigured={state.isApiKeySet}
            placeholder={t('app-config.api-key.placeholder', 'Your secret API key')}
            onChange={onChange}
            onReset={onResetApiKey}
          />
        </Field>

        <Field label={t('app-config.api-url.label', 'API Url')} description={t('app-config.api-url.description', '')}>
          <Input
            width={60}
            name="apiUrl"
            id="config-api-url"
            data-testid={testIds.appConfig.apiUrl}
            value={state.apiUrl}
            placeholder={t('app-config.api-url.placeholder', 'E.g.: http://mywebsite.com/api/v1')}
            onChange={onChange}
          />
        </Field>

        <Button type="submit" data-testid={testIds.appConfig.submit} disabled={isSubmitDisabled}>
          {t('app-config.submit-button', 'Save API settings')}
        </Button>
      </FieldSet>
    </form>
  );
};

export default AppConfig;

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<AppPluginSettings>>) => {
  try {
    await updatePlugin(pluginId, data);

    // Reloading the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
    // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
