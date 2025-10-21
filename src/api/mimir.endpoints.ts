import {
  ParsedUserConfiguration,
  ParsedUserConfigurationSchema,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';
import { baseAlertmanagerApi } from './alertmanager.endpoints';
import { WithDataSourceInformation } from './alertmanager.types';
import { getDataSourceSrv } from '@grafana/runtime';
import { AlertManagerDataSourceJsonData } from 'types/datasources';
import z from 'zod';

export interface UpdateAlertmanagerConfigApiArg extends WithDataSourceInformation {
  configuration: ParsedUserConfiguration;
}

export interface UpdateAlertmanagerConfigApiResponse {
  success: boolean;
}

/**
 * Validates that the data source is configured for Mimir implementation.
 * Throws an error if the data source is not using Mimir.
 */
function validateMimirDataSource(dataSourceUID: string): void {
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUID);
  const jsonData = dsSettings?.jsonData as AlertManagerDataSourceJsonData;
  const implementation = jsonData?.implementation ?? 'prometheus';

  if (implementation !== 'mimir') {
    throw new Error(
      `Mimir API endpoints can only be used with Mimir data sources. Data source ${dataSourceUID} is configured as '${implementation}'.`
    );
  }
}

// Inject Mimir-specific endpoints
export const mimirAlertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  overrideExisting: 'throw',
  endpoints: (build) => ({
    getUserConfiguration: build.query<ParsedUserConfiguration, WithDataSourceInformation>({
      query: ({ dataSourceUID }) => {
        validateMimirDataSource(dataSourceUID);
        return {
          url: `/${dataSourceUID}/api/v1/alerts`,
          responseHandler: 'text',
        };
      },
      transformResponse: (response: string): ParsedUserConfiguration => {
        // Use the codec to decode the YAML response into ParsedUserConfiguration
        return YamlToParsedUserConfiguration.decode(response);
      },
      providesTags: (_result, _error, { dataSourceUID }) => [{ type: 'Configuration', id: dataSourceUID }],
      rawResponseSchema: z.string(),
      responseSchema: ParsedUserConfigurationSchema,
    }),
    updateUserConfiguration: build.mutation<UpdateAlertmanagerConfigApiResponse, UpdateAlertmanagerConfigApiArg>({
      query: ({ dataSourceUID, configuration }) => {
        validateMimirDataSource(dataSourceUID);
        return {
          method: 'POST',
          url: `/${dataSourceUID}/api/v1/alerts`,
          headers: {
            'Content-Type': 'application/yaml',
          },
          body: YamlToParsedUserConfiguration.encode(configuration),
        };
      },
      invalidatesTags: (_result, _error, { dataSourceUID }) => [{ type: 'Configuration', id: dataSourceUID }],
    }),
  }),
});
