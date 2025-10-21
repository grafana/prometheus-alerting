import {
  ParsedUserConfiguration,
  ParsedUserConfigurationSchema,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';
import { baseAlertmanagerApi } from './alertmanager.endpoints';
import { WithDataSourceInformation } from './alertmanager.types';
import z from 'zod';

export interface UpdateAlertmanagerConfigApiArg extends WithDataSourceInformation {
  configuration: ParsedUserConfiguration;
}

export interface UpdateAlertmanagerConfigApiResponse {
  success: boolean;
}

// Inject Mimir-specific endpoints
export const mimirAlertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  overrideExisting: 'throw',
  endpoints: (build) => ({
    getUserConfiguration: build.query<ParsedUserConfiguration, WithDataSourceInformation>({
      query: ({ dataSourceUID }) => ({
        url: `/${dataSourceUID}/api/v1/alerts`,
        responseHandler: 'text',
      }),
      transformResponse: (response: string): ParsedUserConfiguration => {
        // Use the codec to decode the YAML response into ParsedUserConfiguration
        return YamlToParsedUserConfiguration.decode(response);
      },
      providesTags: (_result, _error, { dataSourceUID }) => [{ type: 'Configuration', id: dataSourceUID }],
      rawResponseSchema: z.string(),
      responseSchema: ParsedUserConfigurationSchema,
    }),
    updateUserConfiguration: build.mutation<UpdateAlertmanagerConfigApiResponse, UpdateAlertmanagerConfigApiArg>({
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
