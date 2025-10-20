import { ParsedUserConfiguration, YamlToParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { baseAlertmanagerApi } from './alertmanager.endpoints';

export interface UpdateAlertmanagerConfigApiArg {
  dataSourceUID: string;
  configuration: ParsedUserConfiguration;
}

export interface UpdateAlertmanagerConfigApiResponse {
  success: boolean;
}

// Inject Mimir-specific endpoints
export const mimirAlertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  overrideExisting: 'throw',
  endpoints: (build) => ({
    updateAlertmanagerConfig: build.mutation<UpdateAlertmanagerConfigApiResponse, UpdateAlertmanagerConfigApiArg>({
      query: ({ dataSourceUID, configuration }) => ({
        method: 'POST',
        url: `/${dataSourceUID}/api/v1/alerts`,
        headers: {
          'Content-Type': 'application/yaml',
        },
        body: YamlToParsedUserConfiguration.encode(configuration),
      }),
      invalidatesTags: (_result, _error, { dataSourceUID }) => [{ type: 'Configuration', id: dataSourceUID }],
    }),
  }),
});

export const { useUpdateAlertmanagerConfigMutation } = mimirAlertmanagerApi;
