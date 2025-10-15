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
  ParsedAlertmanagerConfig,
  AlertmanagerStatus,
} from '@grafana/external-alertmanager/vanilla';
import { RootState } from 'src/store/store';
import { TransformedAlertmanagerStatusApiResponse, TransformedAlertmanagerStatusApiResponseSchema } from './types';

// Default API instance for backward compatibility
export const alertmanagerApi = createApi({
  reducerPath: 'vanillaAlertmanagerApi',
  baseQuery: async (args, api, extraOptions) => {
    // Read the current data source UID from Redux state
    const state = api.getState() as RootState;
    const dataSourceUID = state.dataSource.selectedUID;

    // Create a base query with the current UID
    const baseQuery = fetchBaseQuery({
      baseUrl: `/api/datasources/proxy/uid/${dataSourceUID}/api/v2`,
    });

    return baseQuery(args, api, extraOptions);
  },
  endpoints: (build) => ({
    getStatus: build.query<TransformedAlertmanagerStatusApiResponse, GetStatusApiArg>({
      query: () => ({ url: `/status` }),
      transformResponse: (response: AlertmanagerStatus): TransformedAlertmanagerStatusApiResponse => {
        // Parse the YAML configuration from `response.config.original`
        const parsed = parseYaml(response.config.original) as ParsedAlertmanagerConfig;

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
    getSilences: build.query<GetSilencesApiResponse, GetSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        params: {
          filter: queryArg.filter,
        },
      }),
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation<PostSilencesApiResponse, PostSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        method: 'POST',
        body: queryArg.postableSilence,
      }),
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query<GetSilenceApiResponse, GetSilenceApiArg>({
      query: (queryArg) => ({ url: `/silence/${queryArg.silenceId}` }),
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation<DeleteSilenceApiResponse, DeleteSilenceApiArg>({
      query: (queryArg) => ({
        url: `/silence/${queryArg.silenceId}`,
        method: 'DELETE',
      }),
    }),
    getAlerts: build.query<GetAlertsApiResponse, GetAlertsApiArg>({
      query: (queryArg) => ({
        url: `/alerts`,
        params: {
          active: queryArg.active,
          silenced: queryArg.silenced,
          inhibited: queryArg.inhibited,
          unprocessed: queryArg.unprocessed,
          filter: queryArg.filter,
          receiver: queryArg.receiver,
        },
      }),
      responseSchema: GetAlertsApiResponseSchema,
    }),
    postAlerts: build.mutation<PostAlertsApiResponse, PostAlertsApiArg>({
      query: (queryArg) => ({
        url: `/alerts`,
        method: 'POST',
        body: queryArg.postableAlerts,
      }),
    }),
    getAlertGroups: build.query<GetAlertGroupsApiResponse, GetAlertGroupsApiArg>({
      query: (queryArg) => ({
        url: `/alerts/groups`,
        params: {
          active: queryArg.active,
          silenced: queryArg.silenced,
          inhibited: queryArg.inhibited,
          muted: queryArg.muted,
          filter: queryArg.filter,
          receiver: queryArg.receiver,
        },
      }),
      responseSchema: GetAlertGroupsApiResponseSchema,
    }),
  }),
});
