import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parse as parseYaml } from '@std/yaml';
import { GettableUserConfigurationSchema, ParsedUserConfiguration, ParsedUserConfigurationSchema } from '@grafana/external-alertmanager/mimir';
import { ParsedAlertmanagerConfigSchema } from '@grafana/external-alertmanager/vanilla';
import z from 'zod';
import { hasDataSourceUID, WithDataSourceUID } from './types';

// Dynamic baseQuery that reads dataSourceUID from query args
const dynamicBaseQuery: ReturnType<typeof fetchBaseQuery> = async (args, api, extraOptions) => {
  // Extract dataSourceUID from the query args
  const dataSourceUID = hasDataSourceUID(args) ? args.dataSourceUID : '';

  // Create and execute base query with the dynamic UID
  return fetchBaseQuery({
    baseUrl: `/api/datasources/proxy/uid/${dataSourceUID}/api`,
  })(args, api, extraOptions);
};

// Default API instance for backward compatibility
export const alertmanagerApi = createApi({
  reducerPath: 'mimirAlertmanagerApi',
  baseQuery: dynamicBaseQuery,
  endpoints: (build) => ({
    getConfiguration: build.query<ParsedUserConfiguration, WithDataSourceUID>({
      query: ({ dataSourceUID }) => ({
        dataSourceUID,
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
      transformResponse: (response: string): ParsedUserConfiguration => {
        const parsedResponse = parseYaml(response);
        const parsedSchemaResponse = GettableUserConfigurationSchema.parse(parsedResponse);

        const alertmanagerConfigParsed = parseYaml(parsedSchemaResponse.alertmanager_config);
        const alertmanagerConfig = ParsedAlertmanagerConfigSchema.parse(alertmanagerConfigParsed);

        return {
          template_files: parsedSchemaResponse.template_files,
          alertmanager_config: alertmanagerConfig
        };
      },
      // before we transform it, it returns a YAML string
      rawResponseSchema: z.string(),
      // now check if the parsed YAML matches our configuration definition
      responseSchema: ParsedUserConfigurationSchema
    }),
    postConfiguration: build.mutation<unknown, WithDataSourceUID<{ config: unknown }>>({
      query: ({ dataSourceUID, config }) => ({
        method: 'POST',
        url: `/v1/alerts`,
        data: config,
        dataSourceUID,
      }),
    }),
  }),
});
