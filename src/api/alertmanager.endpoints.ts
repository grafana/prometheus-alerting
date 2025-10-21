import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  GetStatusApiArg,
  AlertmanagerStatusSchema,
  AlertmanagerStatus,
  DeleteSilenceApiArg,
  DeleteSilenceApiResponse,
  GetAlertGroupsApiArg,
  GetAlertGroupsApiResponse,
  GetAlertGroupsApiResponseSchema,
  GetAlertsApiArg,
  GetAlertsApiResponse,
  GetAlertsApiResponseSchema,
  GetSilenceApiArg,
  GetSilenceApiResponse,
  GetSilenceApiResponseSchema,
  GetSilencesApiArg,
  GetSilencesApiResponse,
  GetSilencesApiResponseSchema,
  PostAlertsApiArg,
  PostAlertsApiResponse,
  PostSilencesApiArg,
  PostSilencesApiResponse,
  PostSilencesApiResponseSchema,
} from '@grafana/external-alertmanager/vanilla';
import {
  TransformedAlertmanagerStatusApiResponse,
  TransformedAlertmanagerStatusApiResponseSchema,
  TransformedAlertmanagerStatusApiResponseTransform,
  WithDataSourceInformation,
} from './alertmanager.types';
import { getDataSourceSrv } from '@grafana/runtime';
import { AlertManagerDataSourceJsonData } from 'types/datasources';

function createAlertmanagerPath(dataSourceUID: string, path: `/${string}`) {
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUID);
  const jsonData = dsSettings?.jsonData as AlertManagerDataSourceJsonData;
  const implementation = jsonData?.implementation ?? 'prometheus';

  return implementation === 'mimir' ? `/${dataSourceUID}/alertmanager/api${path}` : `/${dataSourceUID}/api${path}`;
}

// Base API for Prometheus/vanilla Alertmanager
export const baseAlertmanagerApi = createApi({
  reducerPath: 'alertmanagerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/datasources/proxy/uid',
  }),
  tagTypes: ['Silences', 'Alerts', 'AlertGroups', 'Configuration'],
  endpoints: () => ({}),
});

// Inject Prometheus-specific endpoints (getStatus)
export const alertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  endpoints: (build) => ({
    getStatus: build.query<TransformedAlertmanagerStatusApiResponse, WithDataSourceInformation<GetStatusApiArg>>({
      query: ({ dataSourceUID }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/status`),
      }),
      transformResponse: (response: AlertmanagerStatus): TransformedAlertmanagerStatusApiResponse => {
        // Use Zod codec to parse YAML and validate the entire transformed response
        return TransformedAlertmanagerStatusApiResponseTransform.parse(response);
      },
      providesTags: ['Configuration'],
      rawResponseSchema: AlertmanagerStatusSchema,
      responseSchema: TransformedAlertmanagerStatusApiResponseSchema,
    }),
    getSilences: build.query<GetSilencesApiResponse, WithDataSourceInformation<GetSilencesApiArg>>({
      query: ({ dataSourceUID, filter }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silences`),
        params: {
          filter,
        },
        dataSourceUID,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation<PostSilencesApiResponse, WithDataSourceInformation<PostSilencesApiArg>>({
      query: ({ dataSourceUID, postableSilence }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silences`),
        method: 'POST',
        body: postableSilence,
        dataSourceUID,
      }),
      invalidatesTags: ['Silences'],
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query<GetSilenceApiResponse, WithDataSourceInformation<GetSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silence/${silenceId}`),
        dataSourceUID,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation<DeleteSilenceApiResponse, WithDataSourceInformation<DeleteSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silence/${silenceId}`),
        method: 'DELETE',
        dataSourceUID,
      }),
      invalidatesTags: ['Silences'],
    }),
    getAlerts: build.query<GetAlertsApiResponse, WithDataSourceInformation<GetAlertsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, unprocessed, filter, receiver }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts`),
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
      providesTags: ['Alerts'],
      responseSchema: GetAlertsApiResponseSchema,
    }),
    postAlerts: build.mutation<PostAlertsApiResponse, WithDataSourceInformation<PostAlertsApiArg>>({
      query: ({ dataSourceUID, postableAlerts }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts`),
        method: 'POST',
        body: postableAlerts,
        dataSourceUID,
      }),
      invalidatesTags: ['Alerts', 'AlertGroups'],
    }),
    getAlertGroups: build.query<GetAlertGroupsApiResponse, WithDataSourceInformation<GetAlertGroupsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, muted, filter, receiver }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts/groups`),
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
      providesTags: ['AlertGroups'],
      responseSchema: GetAlertGroupsApiResponseSchema,
    }),
  }),
});
