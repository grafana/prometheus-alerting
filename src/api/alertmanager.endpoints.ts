import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parse as parseYaml } from '@std/yaml';
import {
  GetStatusApiArg,
  GetSilencesApiResponse,
  GetSilencesApiArg,
  GetSilencesApiResponseSchema,
  PostSilencesApiResponse,
  PostSilencesApiArg,
  PostSilencesApiResponseSchema,
  GetSilenceApiResponse,
  GetSilenceApiArg,
  GetSilenceApiResponseSchema,
  DeleteSilenceApiResponse,
  DeleteSilenceApiArg,
  GetAlertsApiResponse,
  GetAlertsApiArg,
  GetAlertsApiResponseSchema,
  PostAlertsApiResponse,
  PostAlertsApiArg,
  GetAlertGroupsApiResponse,
  GetAlertGroupsApiArg,
  GetAlertGroupsApiResponseSchema,
  AlertmanagerStatusSchema,
  ParsedAlertmanagerConfigSchema,
  AlertmanagerStatus,
} from '@grafana/external-alertmanager/vanilla';
import { TransformedAlertmanagerStatusApiResponse, TransformedAlertmanagerStatusApiResponseSchema, WithDataSourceUID, hasDataSourceUID } from './types';

// Dynamic baseQuery that reads dataSourceUID from query args
const dynamicBaseQuery: ReturnType<typeof fetchBaseQuery> = async (args, api, extraOptions) => {
  // Extract dataSourceUID from the query args
  const dataSourceUID = hasDataSourceUID(args) ? args.dataSourceUID : undefined;

  // Create and execute base query with the dynamic UID
  return fetchBaseQuery({
    baseUrl: `/api/datasources/proxy/uid/${dataSourceUID}/api/v2`,
  })(args, api, extraOptions);
};

// Default API instance for backward compatibility
export const alertmanagerApi = createApi({
  reducerPath: 'vanillaAlertmanagerApi',
  baseQuery: dynamicBaseQuery,
  endpoints: (build) => ({
    getStatus: build.query<TransformedAlertmanagerStatusApiResponse, WithDataSourceUID<GetStatusApiArg>>({
      query: ({ dataSourceUID }) => ({ url: `/status`, dataSourceUID }),
      transformResponse: (response: AlertmanagerStatus): TransformedAlertmanagerStatusApiResponse => {
        // Parse the YAML configuration from `response.config.original`
        const parsedYamlConfig = parseYaml(response.config.original);
        const parsed = ParsedAlertmanagerConfigSchema.parse(parsedYamlConfig);

        // add the parsed config to `response.config.parsed`
        return {
          ...response,
          config: {
            ...response.config,
            parsed,
          },
        };
      },
      rawResponseSchema: AlertmanagerStatusSchema,
      responseSchema: TransformedAlertmanagerStatusApiResponseSchema
    }),
    getSilences: build.query<GetSilencesApiResponse, WithDataSourceUID<GetSilencesApiArg>>({
      query: ({ dataSourceUID, filter }) => ({
        url: `/silences`,
        params: {
          filter,
        },
        dataSourceUID,
      }),
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation<PostSilencesApiResponse, WithDataSourceUID<PostSilencesApiArg>>({
      query: ({ dataSourceUID, postableSilence }) => ({
        url: `/silences`,
        method: 'POST',
        body: postableSilence,
        dataSourceUID,
      }),
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query<GetSilenceApiResponse, WithDataSourceUID<GetSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: `/silence/${silenceId}`,
        dataSourceUID,
      }),
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation<DeleteSilenceApiResponse, WithDataSourceUID<DeleteSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: `/silence/${silenceId}`,
        method: 'DELETE',
        dataSourceUID,
      }),
    }),
    getAlerts: build.query<GetAlertsApiResponse, WithDataSourceUID<GetAlertsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, unprocessed, filter, receiver }) => ({
        url: `/alerts`,
        params: {
          active,
          silenced,
          inhibited,
          unprocessed,
          filter,
          receiver,
        },
        dataSourceUID,
      }),
      responseSchema: GetAlertsApiResponseSchema,
    }),
    postAlerts: build.mutation<PostAlertsApiResponse, WithDataSourceUID<PostAlertsApiArg>>({
      query: ({ dataSourceUID, postableAlerts }) => ({
        url: `/alerts`,
        method: 'POST',
        body: postableAlerts,
        dataSourceUID,
      }),
    }),
    getAlertGroups: build.query<GetAlertGroupsApiResponse, WithDataSourceUID<GetAlertGroupsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, muted, filter, receiver }) => ({
        url: `/alerts/groups`,
        params: {
          active,
          silenced,
          inhibited,
          muted,
          filter,
          receiver,
        },
        dataSourceUID,
      }),
      responseSchema: GetAlertGroupsApiResponseSchema,
    }),
  }),
});
