import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parse as parseYaml } from '@std/yaml';
import { GettableUserConfigurationSchema, ParsedUserConfiguration, ParsedUserConfigurationSchema } from '@grafana/external-alertmanager/mimir';
import { ParsedAlertmanagerConfig } from '@grafana/external-alertmanager/vanilla';
import { RootState } from 'src/store/store';
import z from 'zod';

// Default API instance for backward compatibility
export const alertmanagerApi = createApi({
  reducerPath: 'mimirAlertmanagerApi',
  baseQuery: async (args, api, extraOptions) => {
    // Read the current data source UID from Redux state
    const state = api.getState() as RootState;
    const dataSourceUID = state.dataSource.selectedUID;

    // Create a base query with the current UID
    const baseQuery = fetchBaseQuery({
      baseUrl: `/api/datasources/proxy/uid/${dataSourceUID}/api`,
    });

    return baseQuery(args, api, extraOptions);
  },
  endpoints: (build) => ({
    getConfiguration: build.query<ParsedUserConfiguration, void>({
      query: () => ({
        url: '/v1/alerts',
        headers: {
          accept: 'application/yaml' // not required since it's hard-code to always return YAML but we're being nice guys
        },
        responseHandler: 'text' // do not use the JSON parser and treat response as plain text
      }),
      onSchemaFailure: (error) => {
        // @TODO send to Faro or something
        console.error(z.prettifyError(error))
      },
      // @TODO make this a separate function definition and use everywhere?
      catchSchemaFailure: (error) => ({
        status: 'CUSTOM_ERROR',
        error: z.prettifyError(error),
        data: error.issues,
      }),
      transformResponse: (response: string) => {
        const parsedResponse = parseYaml(response);
        const parsedSchemaResponse = GettableUserConfigurationSchema.parse(parsedResponse);

        return {
          ...parsedSchemaResponse,
          alertmanager_config: parseYaml(parsedSchemaResponse.alertmanager_config) as ParsedAlertmanagerConfig
        } as ParsedUserConfiguration;
      },
      // before we transform it, it returns a YAML string
      rawResponseSchema: z.string(),
      // now check if the parsed YAML matches our configuration definition
      responseSchema: ParsedUserConfigurationSchema
    }),
    postConfiguration: build.mutation<unknown, unknown>({
      query: (config) => ({
        method: 'POST',
        url: `/v1/alerts`,
        data: config,
      }),
    }),
  }),
});
