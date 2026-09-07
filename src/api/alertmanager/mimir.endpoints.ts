import { z } from 'zod';
import { ParsedUserConfiguration, YamlToParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { baseAlertmanagerApi } from './alertmanager.endpoints';
import { WithDataSourceInformation } from './alertmanager.types';
import {
  validateMimirDataSource,
  parseUserConfigurationResponse,
  fetchMimirUserConfigurationWithRetry,
} from './mimir.utils';

// Inject Mimir-specific endpoints
export const mimirAlertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  overrideExisting: 'throw',
  endpoints: (build) => ({
    /**
     * ⚠️ Mimir is a bit weird with its user configuration for several reasons;
     * 1. You fetch the configuration with the /api/v1/alerts endpoint which doesn't actually return any alerts
     * 2. The user configuration is lazily intialized – the first time you fetch it, if the tenant is not initialized yet,
     *    you will receive a lazy initialization error. You have to "wake up" the tenant by calling another endpoint first.
     * 3. The configuration is returned as a YAML string, which then needs to be parsed into the ParsedUserConfiguration format.
     */
    getUserConfiguration: build.query<ParsedUserConfiguration, WithDataSourceInformation>({
      queryFn: async ({ dataSourceUID }, api, _extraOptions, baseQuery) => {
        // double check if we're not calling this endpoint with a vanilla Alertmanager data source
        validateMimirDataSource(dataSourceUID);

        const response = await fetchMimirUserConfigurationWithRetry(dataSourceUID, api, baseQuery);
        if (response.error) {
          return { error: response.error };
        }

        // Parse and validate the YAML response
        return parseUserConfigurationResponse(response.data);
      },
      // No responseSchema: parseUserConfigurationResponse already decodes through
      // YamlToParsedUserConfiguration, whose output schema is ParsedUserConfigurationSchema, and it
      // reports a failure as a PARSING_ERROR with the raw response attached.
      providesTags: ['Configuration'],
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
      invalidatesTags: ['Configuration'],
    }),
    /**
     * The stored configuration document, exactly as Mimir returns it – no parsing, no reformatting.
     * The YAML configuration editor reads this so people see the comments, key order and quoting
     * they wrote, and so a configuration our schemas don't recognise can still be opened and fixed.
     */
    getUserConfigurationDocument: build.query<string, WithDataSourceInformation>({
      queryFn: async ({ dataSourceUID }, api, _extraOptions, baseQuery) => {
        validateMimirDataSource(dataSourceUID);

        const response = await fetchMimirUserConfigurationWithRetry(dataSourceUID, api, baseQuery);
        if (response.error) {
          return { error: response.error };
        }

        return { data: String(response.data) };
      },
      providesTags: ['Configuration'],
      responseSchema: z.string(),
    }),
    /** Posts a configuration document verbatim. Mimir validates the configuration it contains. */
    updateUserConfigurationDocument: build.mutation<UpdateAlertmanagerConfigApiResponse, UpdateConfigDocumentApiArg>({
      query: ({ dataSourceUID, document }) => {
        validateMimirDataSource(dataSourceUID);
        return {
          method: 'POST',
          url: `/${dataSourceUID}/api/v1/alerts`,
          headers: {
            'Content-Type': 'application/yaml',
          },
          body: document,
        };
      },
      invalidatesTags: ['Configuration'],
    }),
  }),
});

export interface UpdateConfigDocumentApiArg extends WithDataSourceInformation {
  document: string;
}

export interface UpdateAlertmanagerConfigApiArg extends WithDataSourceInformation {
  configuration: ParsedUserConfiguration;
}

export interface UpdateAlertmanagerConfigApiResponse {
  success: boolean;
}
