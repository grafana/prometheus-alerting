import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  ParsedUserConfiguration,
  ParsedUserConfigurationSchema,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';
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
      providesTags: ['Configuration'],
      // Validate the final output from queryFn against the schema
      // Cast needed: zod v4 vendors its own Standard Schema types rather than depending on
      // @standard-schema/spec, causing a module identity mismatch with RTK Query. Safe at runtime.
      // See: https://github.com/colinhacks/zod/issues/4938
      responseSchema: ParsedUserConfigurationSchema as unknown as StandardSchemaV1<ParsedUserConfiguration>,
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
  }),
});

export interface UpdateAlertmanagerConfigApiArg extends WithDataSourceInformation {
  configuration: ParsedUserConfiguration;
}

export interface UpdateAlertmanagerConfigApiResponse {
  success: boolean;
}
