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
      queryFn: async ({ dataSourceUID, configuration }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          method: 'POST',
          url: `/${dataSourceUID}/api/v1/alerts`,
          headers: {
            'Content-Type': 'application/yaml',
          },
          body: YamlToParsedUserConfiguration.encode(configuration),
        });

        // Add 3 second delay for testing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (result.error) {
          return { error: result.error };
        }

        return { data: result.data as UpdateAlertmanagerConfigApiResponse };
      },
      invalidatesTags: (_result, _error, { dataSourceUID }) => [{ type: 'Configuration', id: dataSourceUID }],
    }),
  }),
});

export const { useUpdateAlertmanagerConfigMutation } = mimirAlertmanagerApi;
