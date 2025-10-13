import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parse as parseYaml } from '@std/yaml';
import {
  GetStatusApiResponse,
  GetStatusApiArg,
  GetStatusApiResponseSchema,
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
} from '@grafana/external-alertmanager/vanilla';
import { RootState } from 'src/store/store';

// Default API instance for backward compatibility
export const alertmanagerApi = createApi({
  reducerPath: 'alertmanagerApi',
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
    getStatus: build.query<GetStatusApiResponse, GetStatusApiArg>({
      query: () => ({ url: `/status` }),
      transformResponse: (response): GetStatusApiResponse => {
        // Parse and validate the response with Zod
        const validatedResponse = GetStatusApiResponseSchema.parse(response);

        // Parse the YAML configuration
        const parsed = parseYaml(validatedResponse.config.original) as NonNullable<
          GetStatusApiResponse['config']['parsed']
        >;

        return {
          ...validatedResponse,
          config: {
            ...validatedResponse.config,
            parsed,
          },
        };
      },
    }),
    getSilences: build.query<GetSilencesApiResponse, GetSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        params: {
          filter: queryArg.filter,
        },
      }),
      transformResponse: (response: unknown): GetSilencesApiResponse => {
        return GetSilencesApiResponseSchema.parse(response);
      },
    }),
    postSilences: build.mutation<PostSilencesApiResponse, PostSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        method: 'POST',
        body: queryArg.postableSilence,
      }),
      transformResponse: (response: unknown): PostSilencesApiResponse => {
        return PostSilencesApiResponseSchema.parse(response);
      },
    }),
    getSilence: build.query<GetSilenceApiResponse, GetSilenceApiArg>({
      query: (queryArg) => ({ url: `/silence/${queryArg.silenceId}` }),
      transformResponse: (response: unknown): GetSilenceApiResponse => {
        return GetSilenceApiResponseSchema.parse(response);
      },
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
      transformResponse: (response: unknown): GetAlertsApiResponse => {
        return GetAlertsApiResponseSchema.parse(response);
      },
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
      transformResponse: (response: unknown): GetAlertGroupsApiResponse => {
        return GetAlertGroupsApiResponseSchema.parse(response);
      },
    }),
  }),
});
