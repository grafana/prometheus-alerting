import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parse as parseYaml } from '@std/yaml';
import {
  GetStatusApiResponse,
  GetStatusApiArg,
  GetSilencesApiResponse,
  GetSilencesApiArg,
  PostSilencesApiResponse,
  PostSilencesApiArg,
  GetSilenceApiResponse,
  GetSilenceApiArg,
  DeleteSilenceApiResponse,
  DeleteSilenceApiArg,
  GetAlertsApiResponse,
  GetAlertsApiArg,
  PostAlertsApiResponse,
  PostAlertsApiArg,
  GetAlertGroupsApiResponse,
  GetAlertGroupsApiArg,
} from './types/common';

export const createAlertmanagerApi = (dataSourceUID: string) => {
  return createApi({
    reducerPath: `alertmanagerApi_${dataSourceUID}`,
    baseQuery: fetchBaseQuery({
      baseUrl: `/api/datasources/proxy/uid/${dataSourceUID}/api/v2`,
    }),
    endpoints: (build) => ({
      getStatus: build.query<GetStatusApiResponse, GetStatusApiArg>({
        query: () => ({ url: `/status` }),
        transformResponse: (response: GetStatusApiResponse): GetStatusApiResponse => {
          // Parse the YAML configuration
          const parsed = parseYaml(response.config.original) as NonNullable<GetStatusApiResponse['config']['parsed']>;

          return {
            ...response,
            config: {
              ...response.config,
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
      }),
      postSilences: build.mutation<PostSilencesApiResponse, PostSilencesApiArg>({
        query: (queryArg) => ({
          url: `/silences`,
          method: 'POST',
          body: queryArg.postableSilence,
        }),
      }),
      getSilence: build.query<GetSilenceApiResponse, GetSilenceApiArg>({
        query: (queryArg) => ({ url: `/silence/${queryArg.silenceId}` }),
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
      }),
    }),
  });
};

// Default API instance for backward compatibility
export const api = createAlertmanagerApi('default');
